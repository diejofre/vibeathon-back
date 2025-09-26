import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getTeacherById } from "../controllers/teacherController.js";

const router = Router();

router.get("/:courseId/teachers/:teacherId", requireAuth, getTeacherById);

export default router;
