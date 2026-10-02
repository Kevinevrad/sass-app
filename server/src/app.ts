import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "Ok" });
});

app.get("/api/version", (req, res) => {
  res.json({ version: "0.1.0" });
});

app.use("/api/auth/", authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
