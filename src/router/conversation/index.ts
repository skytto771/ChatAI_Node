// routes/conversationRoutes.ts
import { Router } from "express";
import { ConversationController } from "@/controller/ConversationController";
import { authMiddleware } from "@/middleware/authMiddleware";

const router = Router();


// 会话管理
router.post("/addConversation", authMiddleware, ConversationController.create);
router.post("/getConversationList", authMiddleware, ConversationController.getList);
router.post("/stats", authMiddleware, ConversationController.getStats);
router.post("/getConversationById", authMiddleware, ConversationController.getById);
router.post("/updateConversation", authMiddleware, ConversationController.update);
router.post("/delConversation", authMiddleware, ConversationController.delete);
router.post("/archived/all", authMiddleware, ConversationController.deleteArchived);

// 归档操作
router.post("/:id/archive", authMiddleware, ConversationController.archive);
router.post("/:id/unarchive", authMiddleware, ConversationController.unarchive);

export default router;