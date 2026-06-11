// middleware/auth.js
import { User } from "../models";
import jwtUtil from "../util/jwt";
import { NextFunction, Request, Response } from "express";

/**
 * JWT 认证中间件
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 提取 token
    const token = await jwtUtil.getToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "未提供认证令牌",
        code: "NO_TOKEN",
      });
    }

    // 验证 token
    const decoded = await jwtUtil.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "认证令牌无效或已过期",
        code: "INVALID_TOKEN",
      });
    }

    // 查找用户
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "用户不存在",
        code: "USER_NOT_FOUND",
      });
    }

    user.update({
      status: 'active',
    });

    // 将用户信息挂载到 request
    req.user = user.toJSON();
    req.token = token;
    req.tokenDecoded = decoded;

    next();
  } catch (error) {
    console.error("认证中间件错误:", error);
    res.status(500).json({
      success: false,
      message: "认证服务器错误",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * 角色验证中间件
 */
// const roleMiddleware = (...allowedRoles) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "未认证",
//         code: "UNAUTHORIZED",
//       });
//     }

//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: "权限不足",
//         code: "FORBIDDEN",
//         requiredRoles: allowedRoles,
//         userRole: req.user.role,
//       });
//     }

//     next();
//   };
// };

export {
  authMiddleware,
  // roleMiddleware,
};
