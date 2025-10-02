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
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
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

    console.log("\n" + "=".repeat(60));
    console.log("🔧 FIXING DATABASE INDEXES");
    console.log("=".repeat(60));

    const results: any = {
      menuItems: { dropped: [], created: [], errors: [] },
      categories: { dropped: [], created: [], errors: [] },
      deleted: { menuItems: 0, categories: 0 },
    };

    // Fix MenuItem indexes
    console.log("\n📦 Processing MenuItem Collection...");
    const menuItems = db.collection("menuitems");
    const menuIndexes = await menuItems.indexes();

    console.log(
      `Found ${menuIndexes.length} indexes:`,
      menuIndexes.map((i) => i.name).join(", ")
    );

    // Drop all indexes except _id_
    for (const index of menuIndexes) {
      const indexName = index.name || "";
      if (indexName && indexName !== "_id_") {
        console.log(`  Dropping index: ${indexName}`);
        try {
          await menuItems.dropIndex(indexName);
          results.menuItems.dropped.push(indexName);
          console.log(`  ✓ Dropped ${indexName}`);
        } catch (error: any) {
          console.log(`  ✗ Could not drop ${indexName}: ${error.message}`);
          results.menuItems.errors.push({
            index: indexName,
            error: error.message,
          });
        }
      }
    }

    // Fix Category indexes
    console.log("\n📦 Processing Categories Collection...");
    const categories = db.collection("categories");
    const catIndexes = await categories.indexes();

    console.log(
      `Found ${catIndexes.length} indexes:`,
      catIndexes.map((i) => i.name).join(", ")
    );

    // Drop all indexes except _id_
    for (const index of catIndexes) {
      const indexName = index.name || "";
      if (indexName && indexName !== "_id_") {
        console.log(`  Dropping index: ${indexName}`);
        try {
          await categories.dropIndex(indexName);
          results.categories.dropped.push(indexName);
          console.log(`  ✓ Dropped ${indexName}`);
        } catch (error: any) {
          console.log(`  ✗ Could not drop ${indexName}: ${error.message}`);
          results.categories.errors.push({
            index: indexName,
            error: error.message,
          });
        }
      }
    }

    // Clean up invalid documents
    console.log("\n🧹 Cleaning up invalid documents...");

    const menuDeleted = await menuItems.deleteMany({
      $or: [
        { nameEn: null },
        { nameAm: null },
        { name: null },
        { nameEn: "" },
        { nameAm: "" },
      ],
    });
    results.deleted.menuItems = menuDeleted.deletedCount;
    console.log(`  ✓ Deleted ${menuDeleted.deletedCount} invalid menu items`);

    const catDeleted = await categories.deleteMany({
      $or: [
        { nameEn: null },
        { nameAm: null },
        { name: null },
        { nameEn: "" },
        { nameAm: "" },
      ],
    });
    results.deleted.categories = catDeleted.deletedCount;
    console.log(`  ✓ Deleted ${catDeleted.deletedCount} invalid categories`);

    // Wait for MongoDB to process
    console.log("\n⏳ Waiting for MongoDB to process changes...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create new indexes
    console.log("\n🔨 Creating new indexes...");

    // MenuItem indexes
    try {
      await menuItems.createIndex({ nameEn: 1 }, { unique: true });
      results.menuItems.created.push("nameEn_1");
      console.log("  ✓ Created MenuItem nameEn_1 index");
    } catch (error: any) {
      console.log("  ✗ MenuItem nameEn index error:", error.message);
      results.menuItems.errors.push({
        index: "nameEn_1",
        error: error.message,
      });
    }

    try {
      await menuItems.createIndex({ nameAm: 1 }, { unique: true });
      results.menuItems.created.push("nameAm_1");
      console.log("  ✓ Created MenuItem nameAm_1 index");
    } catch (error: any) {
      console.log("  ✗ MenuItem nameAm index error:", error.message);
      results.menuItems.errors.push({
        index: "nameAm_1",
        error: error.message,
      });
    }

    try {
      await menuItems.createIndex({ categoryId: 1 });
      results.menuItems.created.push("categoryId_1");
      console.log("  ✓ Created MenuItem categoryId_1 index");
    } catch (error: any) {
      console.log("  ✗ MenuItem categoryId index error:", error.message);
    }

    try {
      await menuItems.createIndex({ station: 1 });
      results.menuItems.created.push("station_1");
      console.log("  ✓ Created MenuItem station_1 index");
    } catch (error: any) {
      console.log("  ✗ MenuItem station index error:", error.message);
    }

    // Category indexes
    try {
      await categories.createIndex({ nameEn: 1 }, { unique: true });
      results.categories.created.push("nameEn_1");
      console.log("  ✓ Created Category nameEn_1 index");
    } catch (error: any) {
      console.log("  ✗ Category nameEn index error:", error.message);
      results.categories.errors.push({
        index: "nameEn_1",
        error: error.message,
      });
    }

    try {
      await categories.createIndex({ nameAm: 1 }, { unique: true });
      results.categories.created.push("nameAm_1");
      console.log("  ✓ Created Category nameAm_1 index");
    } catch (error: any) {
      console.log("  ✗ Category nameAm index error:", error.message);
      results.categories.errors.push({
        index: "nameAm_1",
        error: error.message,
      });
    }

    try {
      await categories.createIndex({ station: 1 });
      results.categories.created.push("station_1");
      console.log("  ✓ Created Category station_1 index");
    } catch (error: any) {
      console.log("  ✗ Category station index error:", error.message);
    }

    // Show final state
    console.log("\n📊 Final Index State:");
    const finalMenuIndexes = await menuItems.indexes();
    const finalCatIndexes = await categories.indexes();

    console.log(
      "  MenuItem indexes:",
      finalMenuIndexes.map((i) => i.name).join(", ")
    );
    console.log(
      "  Category indexes:",
      finalCatIndexes.map((i) => i.name).join(", ")
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ INDEX FIX COMPLETED");
    console.log("=".repeat(60) + "\n");

    res.json({
      success: true,
      message: "Indexes fixed successfully",
      results: {
        menuItems: {
          indexesDropped: results.menuItems.dropped,
          indexesCreated: results.menuItems.created,
          documentsDeleted: results.deleted.menuItems,
          errors: results.menuItems.errors,
          finalIndexes: finalMenuIndexes.map((i) => i.name),
        },
        categories: {
          indexesDropped: results.categories.dropped,
          indexesCreated: results.categories.created,
          documentsDeleted: results.deleted.categories,
          errors: results.categories.errors,
          finalIndexes: finalCatIndexes.map((i) => i.name),
        },
      },
    });
  } catch (error: any) {
    console.error("\n❌ Error fixing indexes:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

// Cleanup endpoint to remove invalid menu items
app.post("/api/v1/cleanup-menu", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "DB not connected",
      });
    }

    console.log("\n=== Cleaning Up Menu Items ===");

    const menuItems = db.collection("menuitems");

    // Delete items with file:// image URLs or invalid data
    const result = await menuItems.deleteMany({
      $or: [
        { imageUrl: { $regex: "^file://" } },
        { nameEn: null },
        { nameAm: null },
        { nameEn: "" },
        { nameAm: "" },
      ],
    });

    console.log(`Deleted ${result.deletedCount} invalid menu items`);
    console.log("✅ Cleanup completed\n");

    res.json({
      success: true,
      message: "Cleanup completed",
      deleted: result.deletedCount,
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
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
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    endpoints: {
      health: "/health",
      fixIndexes: "/api/v1/fix-indexes (POST)",
      cleanupMenu: "/api/v1/cleanup-menu (POST)",
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
    console.log("   POST /api/v1/fix-indexes (temporary)");
    console.log("   POST /api/v1/cleanup-menu (temporary)");
    console.log("   POST /api/v1/auth/login");
    console.log("   GET  /api/v1/menu/items");
    console.log("   POST /api/v1/menu/items");
    console.log("   GET  /api/v1/orders/active");
    console.log("   PATCH /api/v1/orders/:id/status");
    console.log("   GET  /api/v1/staff");
    console.log("   POST /api/v1/staff");
    console.log("   GET  /api/v1/categories");
    console.log("   POST /api/v1/categories");
    console.log("   GET  /api/v1/addons");
    console.log("   POST /api/v1/addons");
    console.log("   GET  /api/v1/dashboard/stats");
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
