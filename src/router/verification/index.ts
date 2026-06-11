import express from "express";
import { sendVerificationCode } from "@/controller/VerificationController";
import { requestIdMiddleware } from "@/middleware/requestIddMiddleware";
const router = express.Router();

// 用户路由
// 所有参数都在 body 中，URL 不包含任何参数
router.post("/sendCode", requestIdMiddleware, sendVerificationCode) // 发送验证码

export default router;
