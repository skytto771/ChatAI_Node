// services/VerificationService.ts
import { Op } from 'sequelize';
import crypto from 'crypto';
import { VerificationCode } from '../models';
import EmailService from '../services/Notification/EmailService';
import { ResponseUtil } from '../util/responseUtil';
import { Request, Response } from 'express';
// import SMSService from '../services/notification/SMSService';


// 生成6位数字验证码
function generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
}

// 发送验证码
async function sendCode(
    contact: string,
    type: 'email' | 'phone',
    purpose: 'register' | 'login' | 'reset_password' | 'bind',
    userId?: number
): Promise<{ expiresAt: Date }> {
    // 检查发送频率(1分钟内只能发送一次)
    const recentCode = await VerificationCode.findOne({
        where: {
            contact,
            type,
            purpose,
            created_at: {
            [Op.gt]: new Date(Date.now() - 60 * 1000), // 1分钟内
            },
        },
    });

    if (recentCode) {
        throw new Error('发送过于频繁，请稍后再试');
    }

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期

    // 保存到数据库
    await VerificationCode.create({
        user_id: userId || null,
        contact,
        code,
        type,
        purpose,
        expires_at: expiresAt,
    });

    // 发送验证码
    if (type === 'email') {
        await EmailService.sendVerificationEmail(contact, code);
    } else {
        //   await SMSService.sendVerificationSMS(contact, code);
    }

    return { expiresAt };
}

export const sendVerificationCode = async (req: Request, res: Response)=>{
    const { contact, code, type, purpose } = req.body;
    await sendCode(contact, type, purpose);
    return res.send(ResponseUtil.success(null, '验证码发送成功'));
}

// 验证验证码
async function verifyCode(
    contact: string,
    code: string,
    type: 'email' | 'phone',
    purpose: 'register' | 'login' | 'reset_password' | 'bind'
): Promise<any> {
    const verificationCode = await VerificationCode.findOne({
        where: {
            contact,
            code,
            type,
            purpose,
            verified_at: null, // 未使用过的
            expires_at: {
                [Op.gt]: new Date(), // 未过期
            },
        },
        order: [['created_at', 'DESC']],
    });

    if (!verificationCode) {
    throw new Error('验证码无效或已过期');
    }

    // 标记为已验证
    await verificationCode.update({
        verified_at: new Date(),
    });

    return verificationCode;
}

// 检查是否已验证(用于注册时验证)
async function isVerified(
    contact: string,
    type: 'email' | 'phone',
    purpose: 'register'
): Promise<boolean> {
    const verified = await VerificationCode.findOne({
        where: {
            contact,
            type,
            purpose,
            verified_at: {
                [Op.ne]: null, // 已验证
            },
            expires_at: {
                [Op.gt]: new Date(Date.now() - 30 * 60 * 1000), // 30分钟内验证过的
            },
        },
        order: [['verified_at', 'DESC']],
    });

    return !!verified;
}

// 清理过期验证码(定时任务)
async function cleanExpiredCodes(): Promise<void> {
    await VerificationCode.destroy({
    where: {
        expires_at: {
        [Op.lt]: new Date(),
        },
    },
    });
}
