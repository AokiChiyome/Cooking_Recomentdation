import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rateLimit.middleware";
import { sanitizeRequestBody } from "./middleware/sanitize.middleware";

const app: Application = express();

// Security & core middleware
app.use(helmet());
app.use(
  cors({
    origin: env.nodeEnv === "production"
      ? process.env.CORS_ORIGIN || "http://localhost:5173"
      : "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitization
app.use(sanitizeRequestBody);

// Rate limiting
app.use(apiLimiter);

// Logging
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use(requestLogger);

// Routes
app.use("/api", routes);

// 404 + error handler (luôn đặt cuối cùng)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
