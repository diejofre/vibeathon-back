import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    session({ secret: "hackathon-secret", resave: false, saveUninitialized: true })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/auth", authRoutes);
  app.use("/api/courses", courseRoutes);
  app.use("/api/courses", studentRoutes);
  app.use("/api/courses", teacherRoutes);
  app.use("/api", userRoutes); // /api/me
  app.use("/", sessionRoutes); // /logout

  app.get("/", (req, res) => res.send("API OK"));

  return app;
}
