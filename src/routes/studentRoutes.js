import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { listStudents, getStudentById, updateStudent } from "../controllers/studentController.js";

const router = Router();

router.get("/:courseId/students", requireAuth, listStudents);
router.get("/:courseId/students/:studentId", requireAuth, getStudentById);
router.put("/:courseId/students/:studentId", requireAuth, updateStudent);

export default router;
