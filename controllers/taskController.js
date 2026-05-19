import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// export const createTask = async (req, res) => {
//   try {
//     const {
//       title,
//       taskDate,
//       assignedToId,
//       assignedToManagerId,
//       status,
//       pendingReason,
//       toDepartmentId,
//     } = req.body;

//     if (!title || !taskDate) {
//       return res.status(400).json({ message: "Title and taskDate are required" });
//     }

//     if (!status) {
//       return res.status(400).json({ message: "Status is required" });
//     }

//     if (status === "PENDING" && !pendingReason) {
//       return res.status(400).json({ message: "Pending reason is required" });
//     }

//     if (status === "TRANSFERRED") {
//       if (!toDepartmentId) {
//         return res.status(400).json({ message: "toDepartmentId is required for transfer" });
//       }
//       if (Number(toDepartmentId) === req.user.departmentId) {
//         return res.status(400).json({ message: "Cannot transfer to your own department" });
//       }
//     }

//     // Atomic: task + transfer record created together or both fail
//     const result = await prisma.$transaction(async (tx) => {
//       const task = await tx.task.create({
//         data: {
//           title,
//           taskDate: new Date(taskDate),
//           departmentId: req.user.departmentId,
//           currentDepartmentId:
//             status === "TRANSFERRED"
//               ? Number(toDepartmentId)
//               : req.user.departmentId,
//           assignedToId: assignedToManagerId ? null : assignedToId || null,
//           assignedToManagerId: assignedToId ? null : assignedToManagerId || null,
//           createdById: req.user.id,
//           status,
//           pendingReason: status === "PENDING" ? pendingReason : null,
//         },
//       });

//       let transferRecord = null;

//       if (status === "TRANSFERRED") {
//         transferRecord = await tx.taskTransfer.create({
//           data: {
//             taskId: task.id,
//             fromDepartmentId: req.user.departmentId,
//             toDepartmentId: Number(toDepartmentId),
//             transferredById: req.user.id,
//           },
//         });
//       }

//       return { task, transferRecord };
//     });

//     return res.status(201).json(result);
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const updateTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       title,
//       taskDate,
//       assignedToId,
//       assignedToManagerId,
//       status,
//       pendingReason,
//     } = req.body;

//     // Hard block: transfer must go through its own endpoint
//     if (status === "TRANSFERRED") {
//       return res.status(400).json({
//         message: "Use the /tasks/:id/transfer endpoint to transfer a task",
//       });
//     }

//     const task = await prisma.task.findUnique({
//       where: { id: Number(id) },
//       include: { transfers: true },
//     });

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     if (status === "PENDING" && !pendingReason) {
//       return res.status(400).json({ message: "Pending reason is required" });
//     }

//     // Only the original department can edit title and date
//     const canEditTitleDate = task.departmentId === req.user.departmentId;

//     const updateData = {
//       status: status || task.status,
//       pendingReason: status === "PENDING" ? pendingReason : null,
//       assignedToId: assignedToManagerId
//         ? null
//         : assignedToId !== undefined
//         ? assignedToId
//         : task.assignedToId,
//       assignedToManagerId: assignedToId
//         ? null
//         : assignedToManagerId !== undefined
//         ? assignedToManagerId
//         : task.assignedToManagerId,
//     };

//     if (canEditTitleDate) {
//       if (title) updateData.title = title;
//       if (taskDate) updateData.taskDate = new Date(taskDate);
//     }

//     const updatedTask = await prisma.task.update({
//       where: { id: task.id },
//       data: updateData,
//     });

//     return res.json({ updatedTask });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const transferTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { toDepartmentId, assignedToId, assignedToManagerId } = req.body;

//     if (!toDepartmentId) {
//       return res.status(400).json({ message: "toDepartmentId is required" });
//     }

//     if (Number(toDepartmentId) === req.user.departmentId) {
//       return res.status(400).json({ message: "Cannot transfer to your own department" });
//     }

//     const task = await prisma.task.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     // Only the department currently holding the task can transfer it
//     if (task.currentDepartmentId !== req.user.departmentId) {
//       return res.status(403).json({
//         message: "Only the current holding department can transfer this task",
//       });
//     }

//     // Atomic: update task + create transfer record together
//     const [updatedTask, transferRecord] = await prisma.$transaction([
//       prisma.task.update({
//         where: { id: task.id },
//         data: {
//           status: "TRANSFERRED",
//           currentDepartmentId: Number(toDepartmentId),
//           // Optionally update assignee in the same atomic operation
//           assignedToId: assignedToManagerId
//             ? null
//             : assignedToId !== undefined
//             ? assignedToId
//             : task.assignedToId,
//           assignedToManagerId: assignedToId
//             ? null
//             : assignedToManagerId !== undefined
//             ? assignedToManagerId
//             : task.assignedToManagerId,
//         },
//       }),
//       prisma.taskTransfer.create({
//         data: {
//           taskId: task.id,
//           fromDepartmentId: req.user.departmentId,
//           toDepartmentId: Number(toDepartmentId),
//           transferredById: req.user.id,
//         },
//       }),
//     ]);

//     return res.json({ updatedTask, transferRecord });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

export const createTask = async (req, res) => {
  try {
    const {
      title,
      taskDate,
      assignedToId,
      assignedToManagerId,
      assignees = [],
      comment,
      status,
      pendingReason,
      toDepartmentId,
    } = req.body;

    if (!title || !taskDate) {
      return res
        .status(400)
        .json({ message: "Title and taskDate are required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (status === "PENDING" && !pendingReason) {
      return res.status(400).json({ message: "Pending reason is required" });
    }

    if (status === "TRANSFERRED") {
      if (!toDepartmentId) {
        return res
          .status(400)
          .json({ message: "toDepartmentId is required for transfer" });
      }
      if (Number(toDepartmentId) === req.user.departmentId) {
        return res
          .status(400)
          .json({ message: "Cannot transfer to your own department" });
      }
    }

    // Atomic: task + transfer record created together or both fail
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title,
          taskDate: new Date(taskDate),
          departmentId: req.user.departmentId,
          currentDepartmentId:
            status === "TRANSFERRED"
              ? Number(toDepartmentId)
              : req.user.departmentId,
          assignees,
          comment,
          createdById: req.user.id,
          status,
          pendingReason: status === "PENDING" ? pendingReason : null,
        },
      });

      let transferRecord = null;

      if (status === "TRANSFERRED") {
        transferRecord = await tx.taskTransfer.create({
          data: {
            taskId: task.id,
            fromDepartmentId: req.user.departmentId,
            toDepartmentId: Number(toDepartmentId),
            transferredById: req.user.id,
          },
        });
      }

      return { task, transferRecord };
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      taskDate,
      assignedToId,
      assignedToManagerId,
      assignees,
      comment,
      status,
      pendingReason,
    } = req.body;

    // Hard block: transfer must go through its own endpoint
    if (status === "TRANSFERRED") {
      return res.status(400).json({
        message: "Use the /tasks/:id/transfer endpoint to transfer a task",
      });
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: { transfers: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (status === "PENDING" && !pendingReason) {
      return res.status(400).json({ message: "Pending reason is required" });
    }

    // Only the original department can edit title and date
    const canEditTitleDate = task.departmentId === req.user.departmentId;

    const updateData = {
      status: status || task.status,
      pendingReason: status === "PENDING" ? pendingReason : null,
      ...(assignees !== undefined && { assignees }),
      ...(comment !== undefined && { comment }),
    };

    if (canEditTitleDate) {
      if (title) updateData.title = title;
      if (taskDate) updateData.taskDate = new Date(taskDate);
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: updateData,
    });

    return res.json({ updatedTask });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const transferTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { toDepartmentId, assignedToId, assignedToManagerId, assignees } =
      req.body;

    if (!toDepartmentId) {
      return res.status(400).json({ message: "toDepartmentId is required" });
    }

    if (Number(toDepartmentId) === req.user.departmentId) {
      return res
        .status(400)
        .json({ message: "Cannot transfer to your own department" });
    }

    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only the department currently holding the task can transfer it
    if (task.currentDepartmentId !== req.user.departmentId) {
      return res.status(403).json({
        message: "Only the current holding department can transfer this task",
      });
    }

    // Atomic: update task + create transfer record together
    const [updatedTask, transferRecord] = await prisma.$transaction([
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: "TRANSFERRED",
          currentDepartmentId: Number(toDepartmentId),
          ...(assignees !== undefined && { assignees }),
        },
      }),
      prisma.taskTransfer.create({
        data: {
          taskId: task.id,
          fromDepartmentId: req.user.departmentId,
          toDepartmentId: Number(toDepartmentId),
          transferredById: req.user.id,
        },
      }),
    ]);

    return res.json({ updatedTask, transferRecord });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;

  await prisma.taskTransfer.deleteMany({
    where: { taskId: Number(id) },
  });

  await prisma.task.delete({
    where: { id: Number(id) },
  });

  res.json({ message: "Task deleted" });
};

export const getDepartmentTasks = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const deptId = Number(departmentId);

    const department = await prisma.department.findUnique({
      where: { id: deptId },
      select: { name: true }, // Only need the name
    });

    const { from, to } = req.query;

    let dateFilter;

    if (from || to) {
      dateFilter = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
    } else {
      const now = new Date();
      const pktOffset = 5 * 60;
      const localOffset = now.getTimezoneOffset();
      const pktTime = new Date(
        now.getTime() + (pktOffset + localOffset) * 60000,
      );

      const startOfDay = new Date(pktTime);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(pktTime);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = { gte: startOfDay, lte: endOfDay };
    }

    const deptCondition = {
  OR: [
    { departmentId: deptId },
    { currentDepartmentId: deptId },
    {
      transfers: {
        some: {
          OR: [{ fromDepartmentId: deptId }, { toDepartmentId: deptId }],
        },
      },
    },
  ],
};

const dateCondition =
  from || to
    ? { taskDate: dateFilter }                                  
    : {
        OR: [
          { taskDate: dateFilter },                             
          { status: { in: ["PENDING", "TRANSFERRED"] } },       
        ],
      };

const tasks = await prisma.task.findMany({
  where: {
    AND: [deptCondition, dateCondition],
  },
  include: {
    createdBy: true,
    department: true,
    transfers: {
      include: { fromDepartment: true, toDepartment: true },
      orderBy: { transferredAt: "asc" },
    },
  },
  orderBy: { createdAt: "desc" },
});

    const formattedTasks = tasks.map((task) => {
      let displayStatus = task.status;

      if (task.status === "TRANSFERRED" && task.transfers.length > 0) {
        const sentTransfer = task.transfers.find(
          (t) => t.fromDepartmentId === deptId,
        );
        const receivedTransfer = task.transfers.findLast(
          (t) => t.toDepartmentId === deptId,
        );

        if (sentTransfer && receivedTransfer) {
          displayStatus = `Transferred to ${sentTransfer.toDepartment.name}`;
        } else if (sentTransfer) {
          displayStatus = `Transferred to ${sentTransfer.toDepartment.name}`;
        } else if (receivedTransfer) {
          displayStatus = `Transferred from ${receivedTransfer.fromDepartment.name}`;
        }
      }
   
      return {
        ...task,
        displayStatus,
         assignees: task.assignees || [],
        departmentName: department.name,
      };
    });

    const counts = {
      total: formattedTasks.length,
      pending: formattedTasks.filter((t) => t.status === "PENDING").length,
      complete: formattedTasks.filter((t) => t.status === "COMPLETE").length,
      failed: formattedTasks.filter((t) => t.status === "FAILED").length,
      transferred: formattedTasks.filter((t) => t.status === "TRANSFERRED")
        .length,
    };



    // Add this BEFORE the memberMap loop:
const [deptEmployees, deptManagers] = await Promise.all([
  prisma.employee.findMany({
    where: { departmentId: deptId },
    select: { id: true },
  }),
  prisma.manager.findMany({
    where: { departmentId: deptId },
    select: { id: true },
  }),
]);

const deptMemberKeys = new Set([
  ...deptEmployees.map((e) => `employee-${e.id}`),
  ...deptManagers.map((m) => `manager-${m.id}`),   
]);


const memberMap = {};
formattedTasks.forEach((task) => {
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];

  assignees.forEach((person) => {
    // const key = `${person.role}-${person.id}`;
     const key = `${person.role?.toLowerCase()}-${person.id}`; 

    if (!deptMemberKeys.has(key)) return; 

    if (!memberMap[key]) {
      memberMap[key] = {
        id: person.id,
        key,
        name: person.name,
        role: person.role,
        total: 0,
        completed: 0,
        failed:0,
        pending: 0,
        transferred: 0,
      };
    }
    memberMap[key].total += 1;
    if (task.status === "COMPLETE") memberMap[key].completed += 1;
    if (task.status === "FAILED") memberMap[key].failed += 1;
    if (task.status === "PENDING") memberMap[key].pending += 1;
    if (task.status === "TRANSFERRED") memberMap[key].transferred += 1;
  });
});
const memberStats = Object.values(memberMap);

    res.json({
      counts,
      tasks: formattedTasks,
      departmentName: department.name,
      memberStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDepartmentTasks = async (req, res) => {
  try {
    const managerId = req.user.id;

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { department: true },
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const deptId = manager.departmentId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const department = await prisma.department.findUnique({
      where: { id: deptId },
      select: { name: true },
    });

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { departmentId: deptId },
          { currentDepartmentId: deptId },
          {
            transfers: {
              some: {
                OR: [{ fromDepartmentId: deptId }, { toDepartmentId: deptId }],
              },
            },
          },
        ],
      },
      include: {
       
        createdBy: true,
        department: true,
        transfers: {
          include: { fromDepartment: true, toDepartment: true },
          orderBy: { transferredAt: "asc" },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // const sortedTasks = tasks.sort((a, b) => {
    //   return new Date(b.updatedAt) - new Date(a.updatedAt);
     
    // });

    const sortedTasks = tasks.sort((a, b) => {
  // Priority for status
  const priority = {
    PENDING: 1,
    TRANSFERRED: 1,
    COMPLETE: 2,
    FAILED:2,
  };

  const aPriority = priority[a.status] || 3;
  const bPriority = priority[b.status] || 3;

  // First sort by priority
  if (aPriority !== bPriority) {
    return aPriority - bPriority;
  }

  // Then sort by date (latest first)
  return new Date(b.updatedAt) - new Date(a.updatedAt);
});

    // Pagination
    const paginatedTasks = sortedTasks.slice(skip, skip + limit);

    const formattedTasks = paginatedTasks.map((task) => {
      let displayStatus = task.status;

      // Only compute transfer display for TRANSFERRED tasks
      if (task.status === "TRANSFERRED" && task.transfers.length > 0) {
        const sentTransfer = task.transfers.find(
          (t) => t.fromDepartmentId === deptId,
        );
        const receivedTransfer = task.transfers.findLast(
          (t) => t.toDepartmentId === deptId,
        );

        if (sentTransfer && receivedTransfer) {
          displayStatus = `Transferred to ${sentTransfer.toDepartment.name}`;
        } else if (sentTransfer) {
          displayStatus = `Transferred to ${sentTransfer.toDepartment.name}`;
        } else if (receivedTransfer) {
          displayStatus = `Transferred from ${receivedTransfer.fromDepartment.name}`;
        }
      }

      return {
        ...task,
        displayStatus,
         assignees: task.assignees || [],
        departmentName: department.name,
        departmentId: deptId,
      };
    });
    const totalTasks = tasks.length;

    const counts = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
      complete: tasks.filter((t) => t.status === "COMPLETE").length,
      failed: tasks.filter((t) => t.status === "FAILED").length,
      transferred: tasks.filter((t) => t.status === "TRANSFERRED").length,
    };

    res.json({
      counts,
      tasks: formattedTasks,
      departmentName: department.name,
      departmentId: deptId,

      pagination: {
        total: totalTasks,
        page,
        limit,
        totalPages: Math.ceil(totalTasks / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAlertTasks = async (req, res) => {
  try {
    const managerId = req.user.id;

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { department: true },
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const deptId = manager.departmentId;

    const department = await prisma.department.findUnique({
      where: { id: deptId },
      select: { name: true },
    });

    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ["PENDING", "TRANSFERRED"] },
        OR: [
          { departmentId: deptId },
          { currentDepartmentId: deptId },
          {
            transfers: {
              some: {
                OR: [{ fromDepartmentId: deptId }, { toDepartmentId: deptId }],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        pendingReason: true,
        assignees: true,
        transfers: {
          select: {
            fromDepartmentId: true,
            toDepartmentId: true,
            fromDepartment: { select: { name: true } },
            toDepartment: { select: { name: true } },
          },
          orderBy: { transferredAt: "asc" },
        },
      },
    });

    const formattedTasks = tasks.map((task) => {
      let displayStatus = task.status;

      if (task.status === "TRANSFERRED" && task.transfers.length > 0) {
        const sentTransfer = task.transfers.find(
          (t) => t.fromDepartmentId === deptId
        );
        const receivedTransfer = task.transfers.findLast(
          (t) => t.toDepartmentId === deptId
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
        status: task.status,
        displayStatus,
        pendingReason: task.pendingReason ?? null,
        assignees: task.assignees || [],
      };
    });

    res.json({ tasks: formattedTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getManagerTasks = async (req, res) => {
  try {
    const managerId = req.user.id;

    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { department: true },
    });

    if (!manager) return res.status(404).json({ message: "Manager not found" });

    // A dept sees a task if they created it OR currently hold it OR were in the transfer chain
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { departmentId: manager.departmentId },
          { currentDepartmentId: manager.departmentId },
          {
            transfers: {
              some: {
                OR: [
                  { fromDepartmentId: manager.departmentId },
                  { toDepartmentId: manager.departmentId },
                ],
              },
            },
          },
        ],
      },
      include: {
        assignedTo: true,
        createdBy: true,
        department: true,
        transfers: {
          include: { fromDepartment: true, toDepartment: true },
          orderBy: { transferredAt: "asc" },
        },
      },
      orderBy: { taskDate: "desc" },
    });

    const formattedTasks = tasks.map((task) => {
      let displayStatus = task.status;

      if (task.transfers.length > 0) {
        // Find this dept's role in the transfer chain
        const sentTransfer = task.transfers.find(
          (t) => t.fromDepartmentId === manager.departmentId,
        );
        const receivedTransfer = task.transfers.findLast(
          (t) => t.toDepartmentId === manager.departmentId,
        );

        if (sentTransfer && receivedTransfer) {
          // Middle dept: received and then re-transferred
          displayStatus = `Transferred From: ${receivedTransfer.fromDepartment.name} | Transferred To: ${sentTransfer.toDepartment.name}`;
        } else if (sentTransfer) {
          // Sender
          displayStatus = `Transferred To: ${sentTransfer.toDepartment.name}`;
        } else if (receivedTransfer) {
          // Receiver
          displayStatus = `Transferred From: ${receivedTransfer.fromDepartment.name}`;
        }
      }

      return { ...task, displayStatus };
    });

    res.json(formattedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOtherDepartments = async (req, res) => {
  try {
    const managerId = req.user.id;

    // Get the manager and their current department
    const manager = await prisma.manager.findUnique({
      where: { id: managerId },
      include: { department: true },
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const currentDeptId = manager.departmentId;

    // Fetch all departments excluding the current one
    const otherDepartments = await prisma.department.findMany({
      where: {
        id: { not: currentDeptId },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({ departments: otherDepartments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDepartmentMemberTasks = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const deptId = Number(departmentId);

    // Replace the date filter section at the top with this:
    const { from, to } = req.query;

    let dateFilter;

    if (from || to) {
      dateFilter = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
    } else {
      const now = new Date();
      const pktOffset = 5 * 60;
      const localOffset = now.getTimezoneOffset();
      const pktTime = new Date(
        now.getTime() + (pktOffset + localOffset) * 60000,
      );

      const startOfDay = new Date(pktTime);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(pktTime);
      endOfDay.setHours(23, 59, 59, 999);

      dateFilter = { gte: startOfDay, lte: endOfDay };
    }
    const tasks = await prisma.task.findMany({
      where: {
        taskDate: dateFilter,
        OR: [
          { assignedTo: { departmentId: deptId } },
          { assignedToManager: { departmentId: deptId } },
        ],
      },
      include: {
        assignedTo: true,
        assignedToManager: {
          select: { id: true, name: true, departmentId: true },
        },
        createdBy: true,
        department: true,
        transfers: {
          include: { fromDepartment: true, toDepartment: true },
          orderBy: { transferredAt: "asc" },
        },
      },
      orderBy: { taskDate: "desc" },
    });

    const formattedTasks = tasks.map((task) => {
      let displayStatus = task.status;

      if (task.transfers.length > 0) {
        const sentTransfer = task.transfers.find(
          (t) => t.fromDepartmentId === deptId,
        );
        const receivedTransfer = task.transfers.findLast(
          (t) => t.toDepartmentId === deptId,
        );

        if (sentTransfer && receivedTransfer) {
          displayStatus = `Transferred From: ${receivedTransfer.fromDepartment.name} | Transferred To: ${sentTransfer.toDepartment.name}`;
        } else if (sentTransfer) {
          displayStatus = `Transferred To: ${sentTransfer.toDepartment.name}`;
        } else if (receivedTransfer) {
          displayStatus = `Transferred From: ${receivedTransfer.fromDepartment.name}`;
        }
      }

      const assignee = task.assignedTo
        ? { ...task.assignedTo, role: "Employee" }
        : task.assignedToManager
          ? { ...task.assignedToManager, role: "Manager" }
          : null;

      return { ...task, displayStatus, assignee };
    });

    // Overall counts
    const counts = {
      total: formattedTasks.length,
      pending: formattedTasks.filter((t) => t.status === "PENDING").length,
      complete: formattedTasks.filter((t) => t.status === "COMPLETE").length,
      failed: formattedTasks.filter((t) => t.status === "FAILED").length,
      transferred: formattedTasks.filter((t) => t.status === "TRANSFERRED")
        .length,
    };

    // Per-member task counts
    const memberStatsMap = {};

    formattedTasks.forEach((task) => {
      if (!task.assignee) return;

      const key = `${task.assignee.role}-${task.assignee.id}`;

      if (!memberStatsMap[key]) {
        memberStatsMap[key] = {
          id: task.assignee.id,
          name: task.assignee.name,
          role: task.assignee.role,
          total: 0,
          pending: 0,
          complete: 0,
          failed:0,
          transferred: 0,
        };
      }

      memberStatsMap[key].total++;
      if (task.status === "PENDING") memberStatsMap[key].pending++;
      if (task.status === "COMPLETE") memberStatsMap[key].complete++;
         if (task.status === "FAILED") memberStatsMap[key].failed++;
      if (task.status === "TRANSFERRED") memberStatsMap[key].transferred++;
    });

    const memberStats = Object.values(memberStatsMap).sort(
      (a, b) => b.complete - a.complete, // sort by most completed first
    );

    res.json({ counts, memberStats, tasks: formattedTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
