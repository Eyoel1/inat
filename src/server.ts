import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/database";

// Import routes
import authRoutes from "./routes/authRoutes";
import menuRoutes from "./routes/menuRoutes";
import orderRoutes from "./routes/orderRoutes";
import staffRoutes from "./routes/staffRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import addOnRoutes from "./routes/addOnRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO with proper CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"], // Allow both transports
  allowEIO3: true, // Allow compatibility
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("join_role", (data) => {
    const room = `${data.role}_room`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Make io accessible to routes
app.set("io", io);

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/addons", addOnRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log("\n🚀 Server Information:");
  console.log(`   Port: ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `   MongoDB: ${process.env.MONGODB_URI ? "Connected" : "Not configured"}`
  );
  console.log("\n📡 Available Routes:");
  console.log("   GET  /health");
  console.log("   POST /api/v1/auth/login");
  console.log("   GET  /api/v1/menu/items");
  console.log("   GET  /api/v1/orders/active");
  console.log("\n✨ Server ready!\n");
});

// Handle unhandled rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  httpServer.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

export { io };
