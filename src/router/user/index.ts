import express from "express";
import { getList, getUserById, register, login, edit, setAvatarUrl } from "../../controller/userController";
import { authMiddleware } from "../../middleware/authMiddleware";
const router = express.Router();

// 用户路由
// 所有参数都在 body 中，URL 不包含任何参数
router
  .get("/getUsers", authMiddleware, getList) // 获取用户列表
  .get("/detail/:id", authMiddleware, getUserById) // 获取单个用户（ID 在 body）
  .post("/register", register) // 用户注册
  .post("/login", login) // 用户登录
  .post("/editUser", authMiddleware, edit) // 编辑用户（ID 在 body）
  .post("/setAvatarUrl", authMiddleware, setAvatarUrl);

export default router;
