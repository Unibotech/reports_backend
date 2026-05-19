import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentMembers,
  getAllDepartmentTasksGrouped
} from "../controllers/departmentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.get("/:departmentId/members", getDepartmentMembers);
router.get("/tasks/grouped", getAllDepartmentTasksGrouped);

// Admin routes (you can protect later)
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;