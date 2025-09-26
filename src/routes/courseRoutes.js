import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { listCourses, getCourseById, getCourseWorkStats, listCourseWork, getCourseWorkDetail, getCourseWorkParticipants } from "../controllers/courseController.js";
import { sendAltEmail, sendSMS } from "../controllers/messageController.js";

const router = Router();

router.get("/", requireAuth, listCourses);
router.get("/:courseId", requireAuth, getCourseById);
router.get("/:courseId/coursework", requireAuth, getCourseWorkStats);
router.get("/:courseId/coursework/list", requireAuth, listCourseWork);
router.get("/:courseId/coursework/:taskId", requireAuth, getCourseWorkDetail);
router.get("/:courseId/coursework/:taskId/participants", requireAuth, getCourseWorkParticipants);

// Messaging endpoints
router.post("/:courseId/messages/alt-email", requireAuth, sendAltEmail);
router.post("/:courseId/messages/sms", requireAuth, sendSMS);

export default router;
