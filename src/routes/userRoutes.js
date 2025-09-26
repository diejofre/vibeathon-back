import { Router } from "express";
import { me } from "../controllers/authController.js";

const router = Router();

router.get("/me", me);

export default router;
