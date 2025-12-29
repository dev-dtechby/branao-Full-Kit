import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";   // ✅ VERY IMPORTANT

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 THIS LINE WAS MISSING / WRONG EARLIER
app.use("/api", routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=====================================");
  console.log("🚀 Branao Backend running on port", PORT);
  console.log("🌍 Environment :", process.env.NODE_ENV || "development");
  console.log("=====================================");
});
