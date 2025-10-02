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

// Socket.IO setup
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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

// --- Fix Indexes Endpoint ---
app.post("/api/v1/fix-indexes", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db)
      return res
        .status(500)
        .json({ success: false, message: "Database not connected" });

    console.log("\n🔧 Fixing database indexes...");

    const collections = [
      {
        name: "menuitems",
        uniqueFields: ["nameEn", "nameAm"],
        additionalFields: ["categoryId", "station"],
      },
      {
        name: "categories",
        uniqueFields: ["nameEn", "nameAm"],
        additionalFields: ["station"],
      },
    ];

    const results: any = {};

    for (const col of collections) {
      const collection = db.collection(col.name);
      const indexes = await collection.indexes();
      results[col.name] = { dropped: [], created: [], errors: [], deleted: 0 };

      console.log(`\n📦 Processing collection: ${col.name}`);
      console.log("Existing indexes:", indexes.map((i) => i.name).join(", "));

      // Drop all non-_id_ indexes
      for (const index of indexes) {
        const indexName = index.name || "";
        if (indexName && indexName !== "_id_") {
          try {
            await collection.dropIndex(indexName);
            results[col.name].dropped.push(indexName);
            console.log(`  ✓ Dropped index: ${indexName}`);
          } catch (err: any) {
            results[col.name].errors.push({
              index: indexName,
              error: err.message,
            });
            console.log(
              `  ✗ Failed to drop index: ${indexName} (${err.message})`
            );
          }
        }
      }

      // Remove invalid documents
      const deleteQuery: any = {
        $or: [
          { nameEn: null },
          { nameAm: null },
          { name: null },
          { nameEn: "" },
          { nameAm: "" },
        ],
      };
      const deleted = await collection.deleteMany(deleteQuery);
      results[col.name].deleted = deleted.deletedCount || 0;
      console.log(`  🧹 Deleted ${deleted.deletedCount} invalid documents`);

      // Create new indexes
      for (const field of col.uniqueFields) {
        try {
          await collection.createIndex({ [field]: 1 }, { unique: true });
          results[col.name].created.push(`${field}_1`);
          console.log(`  ✓ Created unique index: ${field}_1`);
        } catch (err: any) {
          results[col.name].errors.push({
            index: `${field}_1`,
            error: err.message,
          });
          console.log(
            `  ✗ Failed to create index: ${field}_1 (${err.message})`
          );
        }
      }

      for (const field of col.additionalFields) {
        try {
          await collection.createIndex({ [field]: 1 });
          results[col.name].created.push(`${field}_1`);
          console.log(`  ✓ Created index: ${field}_1`);
        } catch (err: any) {
          results[col.name].errors.push({
            index: `${field}_1`,
            error: err.message,
          });
          console.log(
            `  ✗ Failed to create index: ${field}_1 (${err.message})`
          );
        }
      }

      // Final index list
      const finalIndexes = await collection.indexes();
      results[col.name].finalIndexes = finalIndexes.map((i) => i.name);
    }

    res.json({ success: true, message: "Indexes fixed successfully", results });
  } catch (err: any) {
    console.error("❌ Error fixing indexes:", err);
    res
      .status(500)
      .json({ success: false, error: err.message, stack: err.stack });
  }
});

// --- Socket.IO ---
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("join_role", (data) => {
    const room = `${data.role}_room`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("disconnect", () =>
    console.log("❌ Client disconnected:", socket.id)
  );
  socket.on("error", (err) => console.error("Socket error:", err));
});

app.set("io", io);

// --- API Routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/addons", addOnRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

// Root
app.get("/", (req, res) => {
  res.json({
    message: "Inat Food POS API",
    version: "1.0.0",
    status: "running",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 404
app.use((req, res) =>
  res
    .status(404)
    .json({
      success: false,
      message: `Route ${req.method} ${req.originalUrl} not found`,
    })
);

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

// Connect to DB
connectDB();

const PORT = process.env.PORT || 3000;

mongoose.connection.once("open", () => {
  httpServer.listen(PORT, () => {
    console.log("\n🚀 INAT FOOD POS SERVER RUNNING");
    console.log(`📍 Port: ${PORT}`);
    console.log(`💾 Database: ${mongoose.connection.name}`);
    console.log("🔌 Socket.IO enabled");
  });
});

// MongoDB errors
mongoose.connection.on("error", (err) =>
  console.error("❌ MongoDB connection error:", err)
);
mongoose.connection.on("disconnected", () =>
  console.log("⚠️ MongoDB disconnected")
);

// Graceful shutdown
["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => {
    console.log(`👋 ${sig} received. Shutting down gracefully...`);
    httpServer.close(() => {
      mongoose.connection.close();
      console.log("✅ Process terminated!");
      process.exit(0);
    });
  });
});

process.on("unhandledRejection", (err: Error) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down...", err);
  httpServer.close(() => process.exit(1));
});

process.on("uncaughtException", (err: Error) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...", err);
  process.exit(1);
});

export { io };
