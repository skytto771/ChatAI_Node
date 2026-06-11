// controllers/MessageController.ts
import { Request, Response } from "express";
import { MessageService } from "../services/MessageService";
import { ResponseUtil } from "../util/responseUtil";
import { BusinessCode } from "../constants/http-status.enum";
import { sendToDeepSeek, sendToDeepSeekStream } from '@/services/OpenAi/DeepseekService'

export class MessageController {
    /**
     * 创建新消息
     */
    static async create(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const { conversationId, role, content, tokensUsed } = req.body;

        try {
            const message = await MessageService.createMessage(conversationId, {
                role,
                content,
                tokensUsed,
            });

            res.status(201).json(
                ResponseUtil.created(message, "消息创建成功", requestId)
            );
        } catch (error) {
            console.error("创建消息失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "创建消息失败", requestId)
            );
        }
    }

    /**
     * 获取消息详情
     */
    static async getById(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { id } = req.body;

        try {
            const message = await MessageService.getMessageById(id, userId);

            if (!message) {
                return res.status(404).json(
                    ResponseUtil.error(BusinessCode.RESOURCE_NOT_FOUND, "消息不存在", requestId)
                );
            }

            res.json(
                ResponseUtil.success(message, "获取消息详情成功", requestId)
            );
        } catch (error) {
            console.error("获取消息详情失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "获取消息详情失败", requestId)
            );
        }
    }

    /**
     * 获取会话的所有消息
     */
    static async getConversationMessages(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { conversationId } = req.body;

        try {
            const result = await MessageService.getConversationMessages(
                conversationId,
                userId
            );

            res.json(
                ResponseUtil.success(result, "获取消息列表成功", requestId)
            );
        } catch (error) {
            console.error("获取消息列表失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "获取消息列表失败", requestId)
            );
        }
    }


    /**
     * 获取会话的最后一条消息
     */
    static async getLastMessage(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { conversationId } = req.body;

        try {
            const message = await MessageService.getLastMessage(conversationId, userId);

            res.json(
                ResponseUtil.success(message, "获取最后消息成功", requestId)
            );
        } catch (error) {
            console.error("获取最后消息失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "获取最后消息失败", requestId)
            );
        }
    }

    /**
     * 更新消息
     */
    static async update(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { id } = req.body;
        const { content, tokensUsed } = req.body;

        try {
            const message = await MessageService.updateMessage(id, userId, {
                content,
                tokensUsed,
            });

            if (!message) {
                return res.status(404).json(
                    ResponseUtil.error(BusinessCode.RESOURCE_NOT_FOUND, "消息不存在", requestId)
                );
            }

            res.json(
                ResponseUtil.success(message, "更新消息成功", requestId)
            );
        } catch (error) {
            console.error("更新消息失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "更新消息失败", requestId)
            );
        }
    }

    /**
     * 删除消息
     */
    static async delete(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { id } = req.body;
        const { deleteFollowing = false } = req.query;

        try {
            const result = await MessageService.deleteMessage(
                id,
                userId,
                deleteFollowing === "true"
            );

            if (result.deletedCount === 0) {
                return res.status(404).json(
                    ResponseUtil.error(BusinessCode.RESOURCE_NOT_FOUND, "消息不存在", requestId)
                );
            }

            res.json(
                ResponseUtil.success(
                    { deletedCount: result.deletedCount },
                    `成功删除 ${result.deletedCount} 条消息`,
                    requestId
                )
            );
        } catch (error) {
            console.error("删除消息失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "删除消息失败", requestId)
            );
        }
    }

    /**
     * 清空会话所有消息
     */
    static async clearConversation(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { conversationId } = req.body;

        try {
            const deletedCount = await MessageService.clearConversationMessages(conversationId, userId);

            res.json(
                ResponseUtil.success(
                    { deletedCount },
                    `成功清空 ${deletedCount} 条消息`,
                    requestId
                )
            );
        } catch (error) {
            console.error("清空消息失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "清空消息失败", requestId)
            );
        }
    }

    /**
     * 获取消息统计
     */
    static async getStats(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;

        try {
            const stats = await MessageService.getMessageStats(userId);

            res.json(
                ResponseUtil.success(stats, "获取消息统计成功", requestId)
            );
        } catch (error) {
            console.error("获取消息统计失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "获取消息统计失败", requestId)
            );
        }
    }

    /**
     * 搜索消息
     */
    static async search(req: Request, res: Response) {
        const requestId = req.headers["x-request-id"] as string;
        const userId = req.user!.id;
        const { keyword, limit = 50, conversationId } = req.query;

        if (!keyword) {
            return res.status(400).json(
                ResponseUtil.error(BusinessCode.PARAM_MISSING, "搜索关键词不能为空", requestId)
            );
        }

        try {
            const messages = await MessageService.searchMessages(
                userId,
                keyword as string,
                {
                    limit: parseInt(limit as string),
                    conversationId: conversationId as string,
                }
            );

            res.json(
                ResponseUtil.success(messages, "搜索成功", requestId)
            );
        } catch (error) {
            console.error("搜索消息失败:", error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "搜索消息失败", requestId)
            );
        }
    }

    static async chatHandler(req: Request, res: Response){
        const requestId = req.headers['x-request-id'] as string;
        const userId = req.user!.id
        const { conversationId } = req.body
        const SAVE_CHUNK_SIZE = 100; // 每100字符保存一次
        let lastSaveLength = 0;
        let fullResponse = ''
        
        const context = await MessageService.getConversationContext(conversationId as string, userId)
        const options = {
            messages: context.messages,
            model: context.conversation.model,
            thinking: context.settings.thinkingMode,
            webSearch: context.settings.enableWebSearch,
            fileUpload: context.settings.enableFileUpload,
        }
        
        try{
            const message = await MessageService.createMessage(conversationId, {
                role: 'assistant',
                content: '',
                tokensUsed: 0,
            })
            
            if(context.settings.streamResponse){
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders(); // 立即发送头部
                
                await sendToDeepSeekStream(options,(back)=>{
                    if(back.type == 'content' && back.content){
                        back['messageId'] = message.id
                        res.write(`${JSON.stringify(back)}\n\n`)
                        fullResponse += back.content
                    }
                    const shouldSaveBySize = back.type === 'finish' || fullResponse.length - lastSaveLength >= SAVE_CHUNK_SIZE;
                    if (shouldSaveBySize || back.type == 'finish') { 
                        message.update({
                            content: fullResponse
                        })
                        lastSaveLength = fullResponse.length
                    }
                    if(back.type == 'finish'){
                        res.end()
                    }
                })

            }else{
                const back = await sendToDeepSeek(options)
                return res.json(
                    ResponseUtil.success(back, 'success', requestId)
                );
            }

        }catch(error){
            console.error(error);
            res.status(500).json(
                ResponseUtil.error(BusinessCode.SYSTEM_ERROR, "服务器繁忙", requestId)
            );
        }
    }
}
