import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import routes from "./routes.js";
import { initDB } from "./db.js";

const app = express();

// Initialize Database
initDB();

/* ================= DIR CHECK ================= */
const __dirname = path.resolve();
const uploadDir = path.join(__dirname, "storage/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ================= BASIC MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

app.use(
  "/files",
  express.static(path.join(__dirname, "storage/uploads"))
);

/* ================= API ROUTES ================= */
app.use("/", routes);

/* ================= START SERVER ================= */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend ishga tushdi: http://localhost:${PORT}`);
});
