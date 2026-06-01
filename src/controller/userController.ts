// controllers/userController.js
import { User, UserAvatar, File } from "../../src/models";
import { createToken } from "../util/jwt";
import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { Op } from "sequelize";
interface SequelizeValidationError extends Error {
  name: 'SequelizeValidationError';
  errors: Array<{
    path: string;
    message: string;
  }>;
}


// 获取所有用户
export const getList = async (req: Request, res: Response) => {
  try {
    const users = await User.findAllSafe({
      order: [["id", "ASC"]],
    });

    res.send({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: (error as Error).message,
    });
  }
};

// ✅ 获取单个用户（ID 在 body 中，不在 URL）
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  // 验证 ID
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "用户ID不能为空",
    });
    0;
  }

  try {
    const user = await User.findByPk((id as string), {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    const userData = user.toJSON();

    res.send({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("获取用户详情失败:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: (error as Error).message,
    });
  }
};

// 用户注册
export const register = async (req: Request, res: Response) => {
  const { username, password, email, phone } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "用户名和密码不能为空",
    });
  }

  try {
    const user = await User.create({
      username,
      password,
      email: email || null,
      phone: phone || null,
      status: 'inactive',
      role: 'user',
    });

    const token = await createToken(user);

    const userData = user.toJSON();

    res.status(201).json({
      success: true,
      message: "注册成功",
      data: {
        user: userData,
        token,
      },
    });
  } catch (err) {
    const error = err as SequelizeValidationError;
    // 验证错误处理
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: error.errors.map((e) => e.message),
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    // 唯一性错误处理
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error("注册失败:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  const { account, password } = req.body;

  if ( !account || !password ) {
    return res.status(400).json({
      success: false,
      message: "账号和密码不能为空",
    });
  }

  try {
    const user = await User.findOne({
      where: {[Op.or]: [{ username:account },{ phone:account },{ email:account }]},
    });

    if(!user) return res.status(401).json({
      success: false,
      message: "用户不存在",
    });

    const valiPsd = await user.validatePassword(password);

    if (!user || !valiPsd) {
      return res.status(401).json({
        success: false,
        message: "用户名或密码错误",
      });
    }

    const token = await createToken(user);

    const userData = user.toJSON();

    res.send({
      success: true,
      message: "登录成功",
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: (error as Error).message,
    });
  }
};

// ✅ 编辑用户（ID 在 body 中）
export const edit = async (req: Request, res: Response) => {
  const { id, username, age, email, phone, password } = req.body;

  // 验证 ID
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "用户ID不能为空",
    });
  }

  try {
    // 查找用户
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    // 构建更新数据
    const updateData:any = {};
    if (username !== undefined) updateData.username = username;
    if (age !== undefined) updateData.age = age;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (password !== undefined) updateData.password = password;

    // 如果没有要更新的字段
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "没有要更新的数据",
      });
    }

    // 更新用户
    await user.update(updateData);

    const userData = user.toJSON();

    res.send({
      success: true,
      message: "更新成功",
      data: userData,
    });
  } catch (err) {
    const error = err as SequelizeValidationError;
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "数据验证失败",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "用户名已被其他用户使用",
      });
    }

    console.error("编辑用户失败:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: error.message,
    });
  }
};

export const setAvatarUrl = async (req: Request, res: Response) => {
  try {
    const { avatarId } = req.body;
    if (!avatarId)
      return res.status(403).json({
        success: false,
        message: "文件id缺失",
      });
    const userId = req.user!.id;

    const existAvatar = await UserAvatar.findOne({
      where: {
        userId: userId,
      },
    });

    if (existAvatar) {
      const preFile = await File.findOne({
        where: {
          id: existAvatar.fileId,
        },
      });

      await existAvatar.update({
        fileId: avatarId,
      });

      // 删除旧头像
      if (preFile) {
        if (preFile.filePath && fs.existsSync(preFile.filePath)) {
          fs.unlinkSync(preFile.filePath);
        } else {
          console.log(`文件不存在或路径为空: ${preFile.filePath}`);
        }
        preFile.destroy();
      }
    } else {
      await UserAvatar.create({
        userId,
        fileId: avatarId,
      });
    }

    res.send({
      success: true,
      message: "更新头像成功",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "服务器错误",
      error: (error as Error).message,
    });
  }
};