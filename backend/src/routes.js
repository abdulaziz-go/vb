console.log("🔥 routes.js ISHLAYAPTI");

import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import pool from "./db.js";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

const router = express.Router();

/* 🔗 SERVER MANZILI (KEYIN DOMAIN QO‘YAMIZ) */
const BASE_URL = "http://127.0.0.1:3000";

/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "storage/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ================= UPLOAD ================= */
router.post("/documents", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Fayl kelmadi" });
    }

    const id = uuidv4();

    await pool.query(
      `INSERT INTO documents (id, filename, status, created_at)
       VALUES ($1, $2, 'active', NOW())`,
      [id, req.file.filename]
    );

    res.json({ success: true, id });
  } catch (e) {
    console.error("UPLOAD ERROR:", e);
    res.status(500).json({ error: "Upload failed" });
  }
});

/* ================= ACTIVE ================= */
router.get("/documents", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM documents WHERE status='active' ORDER BY created_at DESC"
  );
  res.json(r.rows);
});

/* ================= SIGNED ================= */
router.get("/documents/signed", async (req, res) => {
  const r = await pool.query(
    `SELECT id, filename, signed_at, signed_by, qr_token
     FROM documents
     WHERE status='signed'
     ORDER BY signed_at DESC`
  );
  res.json(r.rows);
});

/* ================= ARCHIVED ================= */
router.get("/documents/archived", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM documents WHERE status='archived' ORDER BY created_at DESC"
  );
  res.json(r.rows);
});

/* ================= ARCHIVE ================= */
router.put("/documents/:id/archive", async (req, res) => {
  await pool.query(
    "UPDATE documents SET status='archived' WHERE id=$1",
    [req.params.id]
  );
  res.json({ success: true });
});

/* ================= SIGN + QR + HASH ================= */
router.put("/documents/:id/sign", async (req, res) => {
  try {
    const { id } = req.params;

    const r = await pool.query(
      "SELECT * FROM documents WHERE id=$1",
      [id]
    );
    if (!r.rows.length) {
      return res.status(404).json({ error: "Hujjat topilmadi" });
    }

    const doc = r.rows[0];
    const filePath = path.resolve("storage/uploads", doc.filename);

    /* 1️⃣ PDF ochamiz */
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    /* 2️⃣ TOKEN */
    const qrToken = crypto.randomUUID();
    const verifyUrl = `${BASE_URL}/verify/${id}?token=${qrToken}`;

    /* 3️⃣ QR */
    const qrDataUrl = await QRCode.toDataURL(verifyUrl);
    const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const qrImage = await pdfDoc.embedPng(qrBytes);

    page.drawImage(qrImage, {
      x: page.getWidth() - 120,
      y: 60,
      width: 90,
      height: 90,
    });

    /* 4️⃣ IMZO MATNI */
    page.drawText(
      "BARQAROR SARMOYA GROUP\n" +
      "Mikromoliya tashkiloti\n" +
      "Ijrochi direktori\n" +
      "Axmadjonov Ravshanjon Ruzibayevich\n" +
      `Imzolangan: ${new Date().toLocaleString()}`,
      { x: 40, y: 60, size: 10 }
    );

    /* 5️⃣ PDF saqlaymiz */
    const finalPdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, finalPdfBytes);

    /* 6️⃣ HASH – FAQAT ENDI */
    const finalHash = crypto
      .createHash("sha256")
      .update(finalPdfBytes)
      .digest("hex");

    /* 7️⃣ DB update */
    await pool.query(
      `UPDATE documents
       SET status='signed',
           signed_at=NOW(),
           signed_by='Axmadjonov Ravshanjon Ruzibayevich',
           qr_token=$2,
           file_hash=$3
       WHERE id=$1`,
      [id, qrToken, finalHash]
    );

    res.json({ success: true });
  } catch (e) {
    console.error("SIGN ERROR:", e);
    res.status(500).json({ error: "Sign error" });
  }
});

/* ================= VERIFY (QR TEKSHIRUV) ================= */
router.get("/verify/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.query;

  const r = await pool.query(
    "SELECT * FROM documents WHERE id=$1 AND qr_token=$2",
    [id, token]
  );

  if (!r.rows.length) {
    return res.status(403).send("❌ Noto‘g‘ri QR kod");
  }

  const d = r.rows[0];
  const filePath = path.resolve("storage/uploads", d.filename);

  const bytes = fs.readFileSync(filePath);
  const hash = crypto
    .createHash("sha256")
    .update(bytes)
    .digest("hex");

  if (hash !== d.file_hash) {
    return res.status(403).send("❌ Hujjat o‘zgartirilgan");
  }

  /* ✅ PDF + TASDIQLASH */
  res.send(`
<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Raqamli tasdiqlash</title>
<style>
body{margin:0;font-family:Arial;background:#f3f4f6}
.wrap{display:flex;height:100vh}
.pdf{flex:2}
.pdf iframe{width:100%;height:100%;border:none}
.info{flex:1;padding:20px;background:#fff}
.badge{border-left:4px solid #16a34a;background:#f0fdf4;padding:16px;line-height:1.6}
.ok{color:#16a34a;font-weight:bold}
</style>
</head>
<body>
<div class="wrap">
  <div class="pdf">
    <iframe src="/files/${d.filename}"></iframe>
  </div>
  <div class="info">
    <h3>📄 Raqamli tasdiqlash</h3>
    <div class="badge">
      <strong>BARQAROR SARMOYA GROUP</strong><br>
      Mikromoliya tashkiloti<br><br>
      Ijrochi direktori:<br>
      <strong>${d.signed_by}</strong><br><br>
      <span class="ok">✔ Raqamli tarzda imzolangan va o‘zgartirilmagan</span><br>
      Sana: <strong>${new Date(d.signed_at).toLocaleString()}</strong>
    </div>
    <p style="margin-top:12px;font-size:14px;color:#555">
      Ushbu hujjat QR kod orqali tekshirildi va serverdagi asl nusxa bilan mos.
    </p>
  </div>
</div>
</body>
</html>
`);
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const r = await pool.query(
    "SELECT * FROM admins WHERE username=$1",
    [username]
  );
  if (!r.rows.length) return res.json({ success: false });

  const ok = await bcrypt.compare(password, r.rows[0].password_hash);
  if (!ok) return res.json({ success: false });

  res.json({ success: true });
});

export default router;
