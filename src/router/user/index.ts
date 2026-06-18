import express from "express";
import {
  getList,
  getUserById,
  register,
  login,
  edit,
  setAvatarUrl,
  refreshToken,
  forgotPassword,
  resetPassword,
} from "@/controller/userController";
import { authMiddleware, roleMiddleware } from "@/middleware/authMiddleware";
import { requestIdMiddleware } from "@/middleware/requestIddMiddleware";
const router = express.Router();

// 用户路由
// 所有参数都在 body 中，URL 不包含任何参数
router
  .get(
    "/getUsers",
    requestIdMiddleware,
    authMiddleware,
    roleMiddleware("admin"),
    getList,
  ) // 获取用户列表（仅管理员）
  .post("/detail", requestIdMiddleware, authMiddleware, getUserById) // 获取单个用户（ID 在 body）
  .post("/register", requestIdMiddleware, register) // 用户注册
  .post("/login", requestIdMiddleware, login) // 用户登录
  .post("/editUser", requestIdMiddleware, authMiddleware, edit) // 编辑用户（ID 在 body）
  .post("/setAvatarUrl", requestIdMiddleware, authMiddleware, setAvatarUrl)
  .post("/refreshToken", requestIdMiddleware, refreshToken) // 刷新 Token
  .post("/forgotPassword", requestIdMiddleware, forgotPassword) // 忘记密码（发送重置码）
  .post("/resetPassword", requestIdMiddleware, resetPassword); // 重置密码

export default router;
