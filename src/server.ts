import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
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
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Temporary endpoint to fix database indexes (remove after use)
app.post("/api/v1/fix-indexes", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database not connected",
      });
    }

    console.log("\n=== Fixing Database Indexes ===");

    // Fix MenuItem indexes
    console.log("Fixing MenuItem indexes...");
    const menuItems = db.collection("menuitems");
    const menuIndexes = await menuItems.indexes();

    for (const index of menuIndexes) {
      if (
        index.name !== "_id_" &&
        (index.name === "name_1" ||
          index.name === "name_am_1" ||
          index.name === "name_en_1")
      ) {
        console.log(`Dropping old MenuItem index: ${index.name}`);
        try {
          await menuItems.dropIndex(index.name);
        } catch (error) {
          console.log(`Could not drop ${index.name}, might not exist`);
        }
      }
    }

    // Fix Category indexes
    console.log("Fixing Category indexes...");
    const categories = db.collection("categories");
    const catIndexes = await categories.indexes();

    for (const index of catIndexes) {
      if (
        index.name !== "_id_" &&
        (index.name === "name_1" ||
          index.name === "name_am_1" ||
          index.name === "name_en_1")
      ) {
        console.log(`Dropping old Category index: ${index.name}`);
        try {
          await categories.dropIndex(index.name);
        } catch (error) {
          console.log(`Could not drop ${index.name}, might not exist`);
        }
      }
    }

    // Clean up null values
    console.log("Cleaning up null values...");
    const menuDeleted = await menuItems.deleteMany({
      $or: [{ nameEn: null }, { nameAm: null }],
    });
    const catDeleted = await categories.deleteMany({
      $or: [{ nameEn: null }, { nameAm: null }],
    });

    console.log(`Deleted ${menuDeleted.deletedCount} invalid menu items`);
    console.log(`Deleted ${catDeleted.deletedCount} invalid categories`);

    // Create new indexes
    console.log("Creating new indexes...");
    await menuItems.createIndex({ nameEn: 1 }, { unique: true, sparse: true });
    await menuItems.createIndex({ nameAm: 1 }, { unique: true, sparse: true });
    await categories.createIndex({ nameEn: 1 }, { unique: true, sparse: true });
    await categories.createIndex({ nameAm: 1 }, { unique: true, sparse: true });

    console.log("✅ Indexes fixed successfully!\n");

    res.json({
      success: true,
      message: "Indexes fixed successfully",
      details: {
        menuItemsDeleted: menuDeleted.deletedCount,
        categoriesDeleted: catDeleted.deletedCount,
      },
    });
  } catch (error: any) {
    console.error("Error fixing indexes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
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

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Inat Food POS API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      auth: "/api/v1/auth",
      menu: "/api/v1/menu",
      orders: "/api/v1/orders",
      staff: "/api/v1/staff",
      categories: "/api/v1/categories",
      addons: "/api/v1/addons",
      settings: "/api/v1/settings",
      dashboard: "/api/v1/dashboard",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
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
    console.error("❌ Error:", err);

    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
        error: err,
      }),
    });
  }
);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

// Start server only after successful DB connection
mongoose.connection.once("open", () => {
  httpServer.listen(PORT, () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 INAT FOOD POS SERVER");
    console.log("=".repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`💾 Database: ${mongoose.connection.name}`);
    console.log(`🔌 Socket.IO: Enabled`);
    console.log("=".repeat(60));
    console.log("\n📡 Available Routes:");
    console.log("   GET  /health");
    console.log("   GET  /");
    console.log("   POST /api/v1/auth/login");
    console.log("   GET  /api/v1/menu/items");
    console.log("   GET  /api/v1/orders/active");
    console.log("   PATCH /api/v1/orders/:id/status");
    console.log("   GET  /api/v1/staff");
    console.log("   GET  /api/v1/categories");
    console.log("   GET  /api/v1/addons");
    console.log("   GET  /api/v1/dashboard/stats");
    console.log("   POST /api/v1/fix-indexes (temporary)");
    console.log("=".repeat(60));
    console.log("\n✨ Server ready and listening for connections!\n");
  });
});

// Handle MongoDB connection errors
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

// Handle unhandled rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  httpServer.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Process terminated!");
    mongoose.connection.close();
  });
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received. Shutting down gracefully...");
  httpServer.close(() => {
    console.log("✅ Process terminated!");
    mongoose.connection.close();
    process.exit(0);
  });
});

export { io };
