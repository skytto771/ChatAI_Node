// controllers/UserConversationSettingController.ts
import { Request, Response } from "express";
import { UserConversationSetting, ConversationSetting } from "@/models";
import { ResponseUtil } from "@/util/responseUtil";
import { BusinessCode } from "@/constants/http-status.enum";
import { ConversationService } from "@/services/ConversationService";

interface SequelizeValidationError extends Error {
    name: 'SequelizeValidationError';
    errors: Array<{
        path: string;
        message: string;
    }>;
}

export class ModelSettingController {
    /**
     * 获取用户会话设置
     */
    static async getSettings(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;

        const {} = req.body

        try {
            const settings = await UserConversationSetting.getSettings(userId);

            res.json(
                ResponseUtil.success(settings, "获取会话设置成功", requestId)
            );
        } catch (error) {
            console.error("获取会话设置失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "获取会话设置失败", requestId)
            );
        }
    }

    /**
     * 更新用户会话设置
     */
    static async updateSettings(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;

        const updateSettings = req.body

        try {
            const settings = await UserConversationSetting.updateSettings(userId, updateSettings);

            res.json(
                ResponseUtil.success(settings, "更新会话设置成功", requestId)
            );
        } catch (error) {
            const err = error as SequelizeValidationError
            if(err.name === 'SequelizeValidationError'){
                const errorMessages = err.errors.map((err) => err.message).join(", ");
                res.status(400).json(
                    ResponseUtil.error(BusinessCode.PARAM_INVALID, errorMessages, requestId)
                );
            }
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "更新会话设置失败", requestId)
            );
        }
    }

    static async getConversationSettings(req: Request,res: Response) { 
        const requestId = req.headers['x-request-id'] as string;
        const { conversationId } = req.body
        const userId = req.user!.id

        const userConversationSetting = await UserConversationSetting.getSettings(userId)

        if(!userConversationSetting){
            res.status(404).json(
                ResponseUtil.error(BusinessCode.UNKNOWN_ERROR, "未知错误", requestId)
            );
            return
        }

        if(!conversationId){
            res.status(400).json(
                ResponseUtil.error(BusinessCode.PARAM_ERROR, "参数错误", requestId)
            );
            return;
        }
        try {
            const settings = await ConversationSetting.getSettings(conversationId,userConversationSetting)
            res.json(
                ResponseUtil.success(settings, "获取会话设置成功", requestId)
            );
        } catch (error) {
            console.error("获取会话设置失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "获取会话设置失败", requestId)
            )
        }
    }

    static async updateConversationSettings(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;

        const updateSettings = req.body

        if(!updateSettings.conversationId){
            return res.status(400).json(
                ResponseUtil.error(BusinessCode.PARAM_ERROR, "缺失必要参数", requestId)
            )
        }

        try {
            const conversation = await ConversationService.updateConversation(updateSettings.conversationId, userId, {model:updateSettings.model,title:updateSettings.title});
            const settings = await ConversationSetting.updateSettings(updateSettings.conversationId, updateSettings);

            res.json(
                ResponseUtil.success({settings:settings.toJSON(),conversation:conversation?.toJSON()}, "更新会话设置成功", requestId)
            );
        } catch (error) {
            console.error("更新会话设置失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "更新会话设置失败", requestId)
            );
        }
    }
}