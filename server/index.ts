import express from "express";
import compression from "compression";
import cors from "cors";
import { registerRoutes } from "./routes";
import { logger, createChildLogger } from "./logger";
import { generalLimiter } from "./rateLimiter";

const serverLogger = createChildLogger("server");

// ============================================
// Environment Validation
// ============================================

const isProduction = process.env.NODE_ENV === "production";

// Validate critical environment variables in production
if (isProduction) {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "dev-secret-change-in-production") {
    serverLogger.fatal("SESSION_SECRET must be set in production!");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    serverLogger.fatal("DATABASE_URL must be set in production!");
    process.exit(1);
  }
}

// ============================================
// CORS Configuration
// ============================================

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

// ============================================
// Express App Setup
// ============================================

const app = express();

// Trust proxy for Replit (reverse proxy environment)
app.set("trust proxy", 1);

// Compression middleware
app.use(compression());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      serverLogger.warn({ origin }, "Blocked CORS request");
      return callback(new Error("Origin not allowed by CORS policy"));
    },
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// General rate limiting for all API routes
app.use("/api", generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
      };
      
      if (res.statusCode >= 500) {
        serverLogger.error(logData, "Request failed");
      } else if (res.statusCode >= 400) {
        serverLogger.warn(logData, "Request error");
      } else {
        serverLogger.info(logData, "Request completed");
      }
    }
  });

  next();
});

// ============================================
// Start Server
// ============================================

(async () => {
  await registerRoutes(app);

  app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", message: "Lavei API is running" });
  });

  // Global error handler
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    serverLogger.error({ err, path: req.path, method: req.method }, "Unhandled error");
    res.status(500).json({ message: "Erro interno do servidor" });
  });

  const port = 5000;
  app.listen(port, "0.0.0.0", () => {
    serverLogger.info({ port, env: process.env.NODE_ENV || "development" }, "Backend API started");
  });
})();
