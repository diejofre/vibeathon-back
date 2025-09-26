import dotenv from "dotenv";
import passport from "passport";
import { connectDB } from "./config/db.js";
import { configurePassport } from "./config/passport.js";
import { createApp } from "./app.js";
import { startNotifier } from "./scheduler/notifier.js";

dotenv.config();

// DB
await connectDB(process.env.MONGODB_URI);

// Passport
configurePassport(passport);

// App
const app = createApp();

// Server
app.listen(3000, () => console.log("Backend running on http://localhost:3000"));

// Background scheduler
startNotifier();
