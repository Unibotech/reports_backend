import express from "express";
import {
  getDepartmentReport,
  getCumulativeReport
} from "../controllers/reportsController.js";

const router = express.Router();

/*
  PUBLIC ROUTES
  These are accessible to everyone (no authentication)
*/

/*
  1️⃣ Simple Daily Report (5PM logic applied inside controller)

  GET /api/reports/department/:departmentId
*/
router.get("/department/:departmentId", getDepartmentReport);


/*
  2️⃣ Cumulative Date Range Report

  GET /api/reports/cumulative?departmentId=1&startDate=2025-03-01&endDate=2025-03-05
*/
router.get("/cumulative", getCumulativeReport);

export default router;