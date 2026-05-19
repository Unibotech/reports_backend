import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();


export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await prisma.department.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        message: "Department already exists"
      });
    }

    const department = await prisma.department.create({
      data: { name }
    });

    res.status(201).json(department);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const now = new Date();
    const pktOffset = 5 * 60;
    const localOffset = now.getTimezoneOffset();
    const pktTime = new Date(now.getTime() + (pktOffset + localOffset) * 60000);

    const startOfDay = new Date(pktTime);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(pktTime);
    endOfDay.setHours(23, 59, 59, 999);

    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, name: true }
        }
      }
    });

    const formattedDepartments = await Promise.all(
      departments.map(async (dept) => {
        const tasks = await prisma.task.findMany({
          where: {
  AND: [
    {
      OR: [
        { departmentId: dept.id },
        { currentDepartmentId: dept.id },
        { transfers: { some: { OR: [{ fromDepartmentId: dept.id }, { toDepartmentId: dept.id }] } } },
      ],
    },
    {
      OR: [
        { taskDate: { gte: startOfDay, lte: endOfDay } },
        { status: { in: ["PENDING", "TRANSFERRED"] } },
      ],
    },
  ],
},
          select: {
            id: true,
            status: true
          },
          distinct: ['id'] 
        });

        const todayTasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { departmentId: dept.id },
              { currentDepartmentId: dept.id },
              { transfers: { some: { OR: [{ fromDepartmentId: dept.id }, { toDepartmentId: dept.id }] } } },
            ],
          },
          { taskDate: { gte: startOfDay, lte: endOfDay } },
        ],
      },
      select: { id: true },
      distinct: ["id"],
    });

//     console.log("startOfDay:", startOfDay);
// console.log("endOfDay:", endOfDay);
// console.log("todayTasks for", dept.name, ":", todayTasks.length);
// // also log a sample task date
// const sampleTask = await prisma.task.findFirst({ where: { departmentId: dept.id }, select: { taskDate: true } });
// console.log("sample taskDate:", sampleTask?.taskDate);

        const total = tasks.length;
        const pending = tasks.filter(t => t.status === "PENDING").length;
        const complete = tasks.filter(t => t.status === "COMPLETE").length;
        const failed = tasks.filter(t => t.status === "FAILED").length;
        const transferred = tasks.filter(t => t.status === "TRANSFERRED").length;

        return {
          id: dept.id,
          name: dept.name,
          manager: dept.manager,
              hasTodayTask: todayTasks.length > 0,
          todayTaskStats: {
            total,
            pending,
            complete,
            failed,
            transferred
          }
        };
      })
    );

    res.json(formattedDepartments);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: Number(id) },
      include: {
     manager: {
          select: { id: true, name: true }
        },
        employees: true
      }
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found"
      });
    }

    res.json(department);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updated = await prisma.department.update({
      where: { id: Number(id) },
      data: { name }
    });

    res.json(updated);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Department deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartmentMembers = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }

    const department = await prisma.department.findUnique({
      where: { id: Number(departmentId) },
      include: {
        manager: true,
        employees: true,
      },
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Prepare the members list
    const members = [];

    if (department.manager) {
      members.push({
        id: department.manager.id,
        name: `${department.manager.name} (Manager)`,
        type: "manager", // optional, can be used in frontend logic
      });
    }

    department.employees.forEach(emp => {
      members.push({
        id: emp.id,
        name: emp.name,
        type: "employee",
      });
    });

    return res.json({ members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export const getAllDepartmentTasksGrouped = async (req, res) => {
  try {
    // Today's date range in PKT
    const now = new Date();
    const pktOffset = 5 * 60;
    const localOffset = now.getTimezoneOffset();
    const pktTime = new Date(now.getTime() + (pktOffset + localOffset) * 60000);

    const startOfDay = new Date(pktTime);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(pktTime);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all departments
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // For each department, fetch its today's tasks
    const result = await Promise.all(
      departments.map(async (dept) => {
        const tasks = await prisma.task.findMany({

          where: {
  AND: [
    {
      OR: [
        { departmentId: dept.id },
        { currentDepartmentId: dept.id },
        { transfers: { some: { OR: [{ fromDepartmentId: dept.id }, { toDepartmentId: dept.id }] } } },
      ],
    },
    {
      OR: [
        { taskDate: { gte: startOfDay, lte: endOfDay } },          
        { status: { in: ["PENDING", "TRANSFERRED"] } },     
      ],
    },
  ],
},
         
          select: {
            id: true,
            title: true,
            taskDate: true,
            status: true,
            pendingReason: true,
            comment:true,
            // assignedTo: {
            //   select: { id: true, name: true },
            // },
            // assignedToManager: {
            //   select: { id: true, name: true },
            // },
            assignees:true,
            transfers: {
              include: { fromDepartment: true, toDepartment: true },
              orderBy: { transferredAt: "asc" },
            },
            createdAt:true,
            updatedAt:true
          },
          distinct: ["id"],
          orderBy: { createdAt: "desc" },
        });

        const formattedTasks = tasks.map((task) => {
          // Compute displayStatus
          let displayStatus = task.status;
          if (task.status === "TRANSFERRED" && task.transfers.length > 0) {
            const sentTransfer = task.transfers.find(
              (t) => t.fromDepartmentId === dept.id
            );
            const receivedTransfer = task.transfers.findLast(
              (t) => t.toDepartmentId === dept.id
            );
            if (sentTransfer) {
              displayStatus = `Transferred to ${sentTransfer.toDepartment.name}`;
            } else if (receivedTransfer) {
              displayStatus = `Transferred from ${receivedTransfer.fromDepartment.name}`;
            }
          }

          return {
            id: task.id,
            title: task.title,
            taskDate: task.taskDate,
            status: task.status,
            displayStatus,
            pendingReason: task.pendingReason,
            assignees: task.assignees || [],
            comment:task.comment,
            createdAt:task.createdAt,
            updatedAt:task.updatedAt
          };
        });

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          counts: {
            total: formattedTasks.length,
            pending: formattedTasks.filter((t) => t.status === "PENDING").length,
            complete: formattedTasks.filter((t) => t.status === "COMPLETE").length,
            failed: formattedTasks.filter((t) => t.status === "FAILED").length,
            transferred: formattedTasks.filter((t) => t.status === "TRANSFERRED").length,
          },
          tasks: formattedTasks,
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};