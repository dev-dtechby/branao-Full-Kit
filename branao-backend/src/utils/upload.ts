// D:\Projects\branao.in\clone\branao-Full-Kit\branao-backend\src\utils\upload.ts
import multer from "multer";

// ✅ memoryStorage: Railway/prod में disk folder dependency खत्म
const storage = multer.memoryStorage();

// ✅ Optional safety limits (जरूरत हो तो adjust)
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 12, // sd + wo + up to 10 tender
  },
});

export default upload;
