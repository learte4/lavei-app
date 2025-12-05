import express from "express";
import { registerRoutes } from "./routes";
import cors from "cors";

const rawAllowedOrigins = process.env.ALLOWED_ORIGINS ?? "http://localhost:8081,http://localhost:5000";
const allowedOrigins = rawAllowedOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return false;
  return allowedOrigins.includes(origin);
};

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(`Blocked CORS request from origin "${origin}"`);
      return callback(new Error("Origin not allowed by CORS policy"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  await registerRoutes(app);

  app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'Lavei API is running' });
  });

  const port = 5000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Backend API running on http://0.0.0.0:${port}`);
  });
})();
