// controllers/UserConversationSettingController.ts
import { Request, Response } from "express";
import { UserConversationSetting } from "@/models/UserConversationSetting";
import { ResponseUtil } from "@/util/responseUtil";
import { BusinessCode } from "@/constants/http-status.enum";

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
            console.error("更新会话设置失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "更新会话设置失败", requestId)
            );
        }
    }
}