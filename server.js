import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   MIDDLEWARE
====================== */
app.use(cors());
app.use(express.json());

/* ======================
   MULTER (MEMORY)
====================== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* ======================
   SUPABASE CLIENT
====================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ======================
   TEST ENDPOINT
====================== */
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

/* ======================
   UPLOAD ENDPOINT
====================== */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Dosya gönderilmedi" });
    }

    const ext = req.file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("SUPABASE UPLOAD ERROR:", error);
      return res.status(500).json({ error: "Upload başarısız" });
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;

    res.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

/* ======================
   START SERVER
====================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
