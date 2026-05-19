import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createEmployee, getEmployees } from "../controllers/employeeController.js";

const router = express.Router();


router.post("/", createEmployee);
router.get("/", getEmployees);
/*
  All routes here require manager authentication
*/

// Create a new employee in the manager's department
// router.post("/", authenticate, createEmployee);


// Get all employees in the manager's department
// router.get("/", authenticate, getEmployees);

export default router;