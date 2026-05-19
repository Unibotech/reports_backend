import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
//   createTask,
//   updateTaskStatus,
//   editTask,
//   updateTask,
   
  deleteTask,
  getDepartmentTasks,
  getAllDepartmentTasks,
  getManagerTasks,
  getOtherDepartments,
  getAlertTasks,
  
    transferTask,
    updateTask,
    createTask,
  getDepartmentMemberTasks
 
} from "../controllers/taskController.js";

const router = express.Router();



router.post("/:id/transfer", authenticate, transferTask);
router.patch("/:id", authenticate, updateTask);
router.post("/", authenticate, createTask);

router.get("/all", authenticate, getManagerTasks);
router.get("/department-all/:departmentId",getDepartmentTasks);
router.get("/department/",authenticate,getAllDepartmentTasks)
router.get("/alerts", authenticate, getAlertTasks);
router.get("/other-departments",authenticate,getOtherDepartments)
// router.get("/department/:departmentId", getDepartmentMemberTasks);
// router.put("/:id/status", authenticate, updateTaskStatus);
// router.put("/:id", authenticate, editTask);
router.delete("/:id", authenticate, deleteTask);


export default router;