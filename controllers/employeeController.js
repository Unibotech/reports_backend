import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createEmployee = async (req, res) => {
  try {
    const { name, departmentId } = req.body;

    // Simple validation
    if (!name || !departmentId) {
      return res.status(400).json({
        message: "Name and departmentId are required",
      });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        departmentId: parseInt(departmentId),
      },
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { departmentId } = req.query; // Get departmentId from query params

    // If no departmentId provided, return all employees
    if (!departmentId) {
      const employees = await prisma.employee.findMany();
      return res.json(employees);
    }

    // Filter by departmentId if provided
    const employees = await prisma.employee.findMany({
      where: {
        departmentId: parseInt(departmentId),
      },
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// export const createEmployee = async (req, res) => {
//   try {
//     const { name } = req.body;
//     const departmentId = req.user.departmentId;

//     const employee = await prisma.employee.create({
//       data: {
//         name,
//         departmentId
//       }
//     });

//     res.status(201).json(employee);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const getEmployees = async (req, res) => {
//   const departmentId = req.user.departmentId;

//   const employees = await prisma.employee.findMany({
//     where: { departmentId }
//   });

//   res.json(employees);
// };
