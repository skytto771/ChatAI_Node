import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import logger, { morganStream } from "./util/logger";
import { requestIdMiddleware } from "./middleware/requestIddMiddleware";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandlerMiddleware";
import path from "path";
import { initDB, User } from "./models";
import router from "./router";
import { intervalControl } from "@/job";

const app: Express = express();

// ============ 启动环境校验 ============
const REQUIRED_ENV_VARS = [
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "DB_HOST",
  "ADMIN_PASSWORD",
  "OPENAI_DEEPSEEK_API_KEY",
];

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ 缺少必要的环境变量: ${missingVars.join(", ")}`);
  console.error("   请检查 .env 文件是否完整配置");
  process.exit(1);
}
// JWT_SECRET 在 config/jwt.ts 中校验

// CORS 配置（根据环境变量）
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

console.log("========================================");
console.log("服务器启动中...");
console.log("当前环境:", process.env.NODE_ENV);
console.log("CORS 允许来源:", CORS_ORIGIN);
console.log("========================================");

app.use(requestIdMiddleware);

app.use(express.urlencoded());
app.use(express.json());
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
  }),
);
// 日志配置
if (process.env.NODE_ENV !== "production") {
  console.log("✅ 使用 morgan dev 模式");
  app.use(morgan("dev"));
} else {
  console.log("✅ 使用 morgan combined 模式");
  app.use(morgan("combined", { stream: morganStream }));
}

// 处理静态文件访问
app.use(
  "/images",
  express.static(path.join(__dirname, "uploads/files/images")),
);
app.use(
  "/videos",
  express.static(path.join(__dirname, "uploads/files/videos")),
);
app.use(
  "/others",
  express.static(path.join(__dirname, "uploads/files/others")),
);

// 路由
app.use("/api", router);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库（自动建表）
    await initDB();

    // 插入测试数据
    const adminUsername = "chatAdmin";
    const existingAdmin = await User.findOne({
      where: { username: adminUsername },
    });

    if (!existingAdmin) {
      await User.create({
        username: adminUsername,
        password: process.env.ADMIN_PASSWORD, // 建议使用强密码，后续可通过环境变量配置
        email: "admin@example.com",
        phone: "13800000000",
        nickname: "系统管理员",
        bio: "超级管理员账号",
        role: "admin", // 关键：赋予 admin 角色
        status: "active",
        lastLoginAt: null,
      });
      console.log("✅ 测试数据插入成功");
    }

    // 定时任务
    intervalControl.start();

    // 启动服务器
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 服务器运行在 http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ 启动失败:", error);
    process.exit(1);
  }
};

startServer();
