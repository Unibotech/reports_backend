import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();


const getReportDate = () => {
  const now = new Date();
  const pktTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  if (pktTime.getHours() < 17) {
    pktTime.setDate(pktTime.getDate() - 1);
  }

  return pktTime;
};


export const getDepartmentReport = async (req, res) => {
  const { departmentId } = req.params;

  const reportDate = getReportDate();

  const tasks = await prisma.task.findMany({
    where: {
      departmentId: Number(departmentId),
      taskDate: {
        equals: reportDate
      }
    },
    include: {
      assignedTo: true
    }
  });

  const summary = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    complete: tasks.filter(t => t.status === "COMPLETE").length,
    failed: tasks.filter(t => t.status === "FAILED").length,
    transferred: tasks.filter(t => t.status === "TRANSFERRED").length
  };

  res.json({ tasks, summary });
};


export const getCumulativeReport = async (req, res) => {
  const { departmentId, startDate, endDate } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      departmentId: Number(departmentId),
      taskDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      assignedTo: true
    }
  });

  const summary = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    complete: tasks.filter(t => t.status === "COMPLETE").length,
    failed: tasks.filter(t => t.status === "FAILED").length,
    transferred: tasks.filter(t => t.status === "TRANSFERRED").length
  };

  res.json({ tasks, summary });
};