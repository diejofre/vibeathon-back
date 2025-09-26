import { Router } from "express";
import { postLogout } from "../controllers/authController.js";

const router = Router();

router.post("/logout", postLogout);

export default router;
