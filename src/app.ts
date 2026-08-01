import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { env } from "./config/env";

const app: Application = express();

// Security & core middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use(requestLogger);

// Routes
app.use("/api", routes);

// 404 + error handler (luôn đặt cuối cùng)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
