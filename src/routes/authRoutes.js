import { Router } from "express";
import passport from "passport";
import { authFailure, postLogout, me } from "../controllers/authController.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.rosters.readonly",
      // Necesario para leer trabajos (courseWork)
      "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
      // Opcional: acceso de solo lectura a trabajos de estudiantes (útil si luego mostramos más detalles)
      "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    res.redirect("http://localhost:5173");
  }
);

router.get("/failure", authFailure);
router.post("/logout", postLogout);
router.get("/me", me);

export default router;
