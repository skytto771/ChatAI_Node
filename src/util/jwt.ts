import { Request } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import jwtConfig from "../config/jwt";
import { promisify } from "util";

export const createToken = (userinfo: User): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      userinfo.toJSON(),
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions, // 关键断言
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      },
    );
  });
};

export const getToken = async (req: Request) => {
  const token = req.headers.authorization;
  if (!token) return null;

  return token.split("Bearer ")[1];
};

export const verifyToken = (token: string): Promise<jwt.JwtPayload | null> => {
  return new Promise((resolve) => {
    jwt.verify(token, jwtConfig.secret, (err, decoded) => {
      if (err) resolve(null);
      else resolve(decoded as jwt.JwtPayload);
    });
  });
};

/**
 * 验证 token（忽略过期时间，用于刷新 token）
 */
export const verifyTokenIgnoreExpiry = (
  token: string,
): Promise<jwt.JwtPayload | null> => {
  return new Promise((resolve) => {
    jwt.verify(
      token,
      jwtConfig.secret,
      { ignoreExpiration: true },
      (err, decoded) => {
        if (err) resolve(null);
        else resolve(decoded as jwt.JwtPayload);
      },
    );
  });
};

export default { createToken, getToken, verifyToken, verifyTokenIgnoreExpiry };
