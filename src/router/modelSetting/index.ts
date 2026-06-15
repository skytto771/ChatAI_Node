// routes/messageRoutes.ts
import { Router } from "express";
import { ModelSettingController } from "@/controller/modelSettingsController";
import { authMiddleware } from "@/middleware/authMiddleware";

const router = Router();

// 消息管理
router.post("/getSettings", authMiddleware, ModelSettingController.getSettings);
router.post("/updateSettings", authMiddleware, ModelSettingController.updateSettings);
router.post("/getConversationSettings", authMiddleware, ModelSettingController.getConversationSettings);
router.post("/updateConversationSettings", authMiddleware, ModelSettingController.updateConversationSettings);

export default router;