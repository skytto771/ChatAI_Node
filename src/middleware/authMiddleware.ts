// middleware/auth.js
import { User } from "../models";
import jwtUtil from "../util/jwt";
import { NextFunction, Request, Response } from "express";
import { HttpStatus, BusinessCode } from "../constants/http-status.enum";
import { ResponseUtil } from "@/util/responseUtil";

/**
 * JWT 认证中间件
 */
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = req.headers["x-request-id"] as string;
  try {
    // 提取 token
    const token = await jwtUtil.getToken(req);

    if (!token) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          ResponseUtil.error(
            BusinessCode.AUTH_FAILED,
            "未提供认证令牌",
            requestId,
          ),
        );
    }

    // 验证 token
    const decoded = await jwtUtil.verifyToken(token);

    if (!decoded) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          ResponseUtil.error(
            BusinessCode.TOKEN_INVALID,
            "认证令牌无效或已过期",
            requestId,
          ),
        );
    }

    // 查找用户
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          ResponseUtil.error(
            BusinessCode.USER_NOT_FOUND,
            "用户不存在",
            requestId,
          ),
        );
    }

    // 更新用户活跃状态（异步执行，不阻塞响应）
    user
      .update({ status: "active" })
      .catch((err) => console.error("更新用户状态失败:", err));

    // 将用户信息挂载到 request
    req.user = user.toJSON();
    req.token = token;
    req.tokenDecoded = decoded;

    next();
  } catch (error) {
    console.error("认证中间件错误:", error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(
        ResponseUtil.error(
          BusinessCode.SYSTEM_ERROR,
          "认证服务器错误",
          requestId,
        ),
      );
  }
};

/**
 * 角色验证中间件 — 必须在 authMiddleware 之后使用
 * @param allowedRoles 允许访问的角色列表
 */
const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers["x-request-id"] as string;

    if (!req.user) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(
          ResponseUtil.error(BusinessCode.AUTH_FAILED, "请先登录", requestId),
        );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json(
          ResponseUtil.error(
            BusinessCode.PERMISSION_DENIED,
            `权限不足，需要以下角色之一：${allowedRoles.join(", ")}`,
            requestId,
          ),
        );
    }

    next();
  };
};

export { authMiddleware, roleMiddleware };
