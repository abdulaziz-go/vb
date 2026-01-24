import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes.js";

const app = express();

/* ================= BASIC MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= STATIC FILES (PDF, FILES) ================= */
const __dirname = path.resolve();

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
