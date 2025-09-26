import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    console.warn("[WARN] MONGODB_URI no configurado en .env. Configurá la variable para persistir usuarios.");
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB conectado");
  } catch (err) {
    console.error("Error conectando a MongoDB", err);
    throw err;
  }
}
