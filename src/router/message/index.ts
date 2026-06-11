// routes/messageRoutes.ts
import { Router } from "express";
import { MessageController } from "@/controller/MessageController";
import { authMiddleware } from "@/middleware/authMiddleware";

const router = Router();

// 消息管理
router.post("/addMessage", authMiddleware, MessageController.create);
router.post("/search", authMiddleware, MessageController.search);
router.post("/getStats", authMiddleware, MessageController.getStats);
router.post("/getById", authMiddleware, MessageController.getById);
router.post("/update", authMiddleware, MessageController.update);
router.post("/delete", authMiddleware, MessageController.delete);

// 会话消息
router.post("/getMessageList", authMiddleware, MessageController.getConversationMessages);
router.get("/conversation/:conversationId/last", authMiddleware, MessageController.getLastMessage);
router.delete("/conversation/:conversationId/clear", authMiddleware, MessageController.clearConversation);

// ai消息
router.post('/generateAiReply', authMiddleware, MessageController.chatHandler)

export default router;