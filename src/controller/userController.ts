// controllers/userController.js
import { User, UserAvatar, File } from "../models";
import { createToken } from "../util/jwt";
import fs from "fs";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { ResponseUtil } from "../util/responseUtil";
import { BusinessCode } from "../constants/http-status.enum";
import { verifyCodeSpired } from './VerificationController'

interface SequelizeValidationError extends Error {
    name: 'SequelizeValidationError';
    errors: Array<{
        path: string;
        message: string;
    }>;
}


// 获取所有用户
export const getList = async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    try {
        const users = await User.findAllSafe({
            order: [["id", "ASC"]],
        });

        res.json(ResponseUtil.success(users, '获取用户列表成功', requestId));
    } catch (error) {
        console.error("获取用户列表失败:", error);
        res.status(500).json(ResponseUtil.error(BusinessCode.SYSTEM_ERROR, '获取用户列表失败', requestId));
    }
};

// 获取单个用户信息
export const getUserById = async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;
    const { id } = req.body || {};

    // 验证 ID
    if (!id) {
        return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_MISSING, '用户ID不能为空', requestId));
    }

    try {
        const user = await User.findByPk((id as string), {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(404).json(ResponseUtil.error(BusinessCode.USER_NOT_FOUND, '用户不存在', requestId));
        }

        const userData = user.toJSON();

        res.json(
            ResponseUtil.success(userData, '获取用户详情成功', requestId)
        );
    } catch (error) {
        console.error("获取用户详情失败:", error);
        res.status(500).json(ResponseUtil.error(BusinessCode.SYSTEM_ERROR, '获取用户详情失败', requestId));
    }
};

// 用户注册
export const register = async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;
    const { username, password, email, verifyCode } = req.body || {};

    if (!username || !password) {
        return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_ERROR, '用户名和密码不能为空', requestId));
    }

    if (!verifyCode) {
        return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_ERROR, '验证码不能为空', requestId));
    }

    try {
        await verifyCodeSpired(email, verifyCode, 'email', 'register');
        const user = await User.create({
            username,
            password,
            email: email || null,
            status: 'inactive',
            role: 'user',
        });

        const token = await createToken(user);

        const userData = user.toJSON();

        res.status(201).json(
            ResponseUtil.created({
                user: userData,
                token,
            }, '注册成功', requestId))
    } catch (err) {
        const error = err as SequelizeValidationError;
        // 验证错误处理
        if (error.name === "SequelizeValidationError") {
            const errorMessages = error.errors.map((err) => err.message).join(", ");
            return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_ERROR, errorMessages, requestId));
        }

        // 唯一性错误处理
        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json(
                ResponseUtil.error(BusinessCode.RESOURCE_ALREADY_EXISTS, error.message, requestId)
            );
        }

        console.error("注册失败:", error);
        res.status(500).json(
            ResponseUtil.error(BusinessCode.SYSTEM_ERROR, error.message, requestId)
        );
    }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;
    const { account, password, remember } = req.body || {};

    if (!account || !password) {
        return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_MISSING, '账号和密码不能为空', requestId));
    }

    try {
        const user = await User.findOne({
            where: { [Op.or]: [{ username: account }, { phone: account }, { email: account }] },
        });

        if (!user) return res.status(401).json(ResponseUtil.error(BusinessCode.USER_NOT_FOUND, '用户不存在', requestId));

        const valiPsd = await user.validatePassword(password);

        if (!user || !valiPsd) {
            return res.status(401).json(ResponseUtil.error(BusinessCode.PASSWORD_ERROR, '用户名或密码错误', requestId));
        }

        let token = ''
        if (remember) {
            token = await createToken(user);
        }

        const userData = user.toJSON();

        user.update({
            lastLoginAt: new Date(),
            status: 'active',
        });

        res.json(
            ResponseUtil.success({
                user: userData,
                token,
            }, '登录成功', requestId)
        );
    } catch (error) {
        console.error("登录失败:", error);
        res.status(500).json(ResponseUtil.error(BusinessCode.SYSTEM_ERROR, '登录失败，请稍后重试', requestId));
    }
};

// ✅ 编辑用户（ID 在 body 中）
export const edit = async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;
    const { id, username, age, email, phone, password } = req.body || {};

    // 验证 ID
    if (!id) {
        return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_MISSING, '用户ID不能为空', requestId));
    }

    try {
        // 查找用户
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json(ResponseUtil.error(BusinessCode.USER_NOT_FOUND, '用户不存在', requestId));
        }

        // 构建更新数据
        const updateData: any = {};
        if (username !== undefined) updateData.username = username;
        if (age !== undefined) updateData.age = age;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (password !== undefined) updateData.password = password;

        // 如果没有要更新的字段
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json(ResponseUtil.error(BusinessCode.PARAM_ERROR, '没有要更新的数据', requestId));
        }

        // 更新用户
        await user.update(updateData);

        const userData = user.toJSON();

        res.json(ResponseUtil.success(userData, '更新成功', requestId))
    } catch (err) {
        const error = err as SequelizeValidationError;
        if (error.name === "SequelizeValidationError") {
            const errorMessages = error.errors.map((e) => e.message).join(", ");
            return res.status(400).json(
                ResponseUtil.error(BusinessCode.PARAM_ERROR, errorMessages, requestId)
            )
        }

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json(
                ResponseUtil.error(BusinessCode.RESOURCE_ALREADY_EXISTS, '用户名、邮箱或手机号已被其他用户使用', requestId)
            );
        }

        console.error("编辑用户失败:", error);
        res.status(500).json(
            ResponseUtil.error(BusinessCode.SYSTEM_ERROR, '编辑用户失败', requestId)
        );
    }
};

// 设置头像
export const setAvatarUrl = async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    try {
        const { avatarId } = req.body || {};

        if (!avatarId) {
            return res.status(400).json(
                ResponseUtil.error(BusinessCode.PARAM_MISSING, '文件ID缺失', requestId)
            );
        }

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

            // 删除旧头像文件
            if (preFile) {
                if (preFile.filePath && fs.existsSync(preFile.filePath)) {
                    fs.unlinkSync(preFile.filePath);
                } else {
                    console.log(`文件不存在或路径为空: ${preFile.filePath}`);
                }
                await preFile.destroy();
            }
        } else {
            await UserAvatar.create({
                userId,
                fileId: avatarId,
            });
        }

        res.json(
            ResponseUtil.success(null, '更新头像成功', requestId)
        );
    } catch (error) {
        console.error('设置头像失败:', error);
        res.status(500).json(
            ResponseUtil.error(BusinessCode.SYSTEM_ERROR, '设置头像失败', requestId)
        );
    }
};