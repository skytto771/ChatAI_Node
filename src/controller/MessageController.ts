// controllers/MessageController.ts
import { Request, Response } from "express";
import { MessageService } from "@/services/MessageService";
import { ResponseUtil } from "@/util/responseUtil";
import { BusinessCode } from "@/constants/http-status.enum";
import { sendToDeepSeekStream } from "@/services/OpenAi/DeepseekService";
import { MessageStreamManager } from "@/services/StreamManagerService";

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
        status: "completed",
      });

      res
        .status(201)
        .json(ResponseUtil.created(message, "消息创建成功", requestId));
    } catch (error) {
      console.error("创建消息失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "创建消息失败",
            requestId,
          ),
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
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "消息不存在",
              requestId,
            ),
          );
      }

      res.json(ResponseUtil.success(message, "获取消息详情成功", requestId));
    } catch (error) {
      console.error("获取消息详情失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取消息详情失败",
            requestId,
          ),
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
        userId,
      );

      res.json(ResponseUtil.success(result, "获取消息列表成功", requestId));
    } catch (error) {
      console.error("获取消息列表失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取消息列表失败",
            requestId,
          ),
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
      const message = await MessageService.getLastMessage(
        conversationId,
        userId,
      );

      res.json(ResponseUtil.success(message, "获取最后消息成功", requestId));
    } catch (error) {
      console.error("获取最后消息失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取最后消息失败",
            requestId,
          ),
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
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "消息不存在",
              requestId,
            ),
          );
      }

      res.json(ResponseUtil.success(message, "更新消息成功", requestId));
    } catch (error) {
      console.error("更新消息失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "更新消息失败",
            requestId,
          ),
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
        deleteFollowing === "true",
      );

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "消息不存在",
              requestId,
            ),
          );
      }

      res.json(
        ResponseUtil.success(
          { deletedCount: result.deletedCount },
          `成功删除 ${result.deletedCount} 条消息`,
          requestId,
        ),
      );
    } catch (error) {
      console.error("删除消息失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "删除消息失败",
            requestId,
          ),
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
      const deletedCount = await MessageService.clearConversationMessages(
        conversationId,
        userId,
      );

      res.json(
        ResponseUtil.success(
          { deletedCount },
          `成功清空 ${deletedCount} 条消息`,
          requestId,
        ),
      );
    } catch (error) {
      console.error("清空消息失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "清空消息失败",
            requestId,
          ),
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

      res.json(ResponseUtil.success(stats, "获取消息统计成功", requestId));
    } catch (error) {
      console.error("获取消息统计失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "获取消息统计失败",
            requestId,
          ),
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
      return res
        .status(400)
        .json(
          ResponseUtil.error(
            BusinessCode.PARAM_MISSING,
            "搜索关键词不能为空",
            requestId,
          ),
        );
    }

    try {
      const messages = await MessageService.searchMessages(
        userId,
        keyword as string,
        {
          limit: parseInt(limit as string),
          conversationId: conversationId as string,
        },
      );

      res.json(ResponseUtil.success(messages, "搜索成功", requestId));
    } catch (error) {
      console.error("搜索消息失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "搜索消息失败",
            requestId,
          ),
        );
    }
  }

  static async chatHandler(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { conversationId } = req.body;
    const SAVE_CHUNK_SIZE = 100; // 每100字符保存一次
    let lastSaveLength = 0;
    let fullResponse = "";
    let fullReasoning = "";

    const context = await MessageService.getConversationContext(
      conversationId as string,
      userId,
    );
    if (!context) {
      return ResponseUtil.error(
        BusinessCode.RESOURCE_NOT_FOUND,
        "Conversation not found",
      );
    }
    const options = {
      ...context.settings,
      messages: context.messages,
      model: context.conversation.model,
    };

    try {
      const message = await MessageService.createMessage(conversationId, {
        role: "assistant",
        content: "",
        reasoning: "",
        tokensUsed: 0,
        status: "generating",
      });

      // 注册到流管理器
      MessageStreamManager.createStream(message.id);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders(); // 立即发送头部

      await sendToDeepSeekStream(options, (back) => {
        const chunk = {
          ...back,
          messageId: message.id,
          position: fullResponse.length,
        };
        if (back.type == "content" && back.content) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(message.id, chunk);
          fullResponse += back.content;
        }
        if (back.type == "reasoning_content" && back.content) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(message.id, chunk);
          fullReasoning += back.content;
        }
        const shouldSaveBySize =
          back.type === "finish" ||
          fullResponse.length - lastSaveLength >= SAVE_CHUNK_SIZE;
        if (shouldSaveBySize || back.type == "finish") {
          message.update({
            content: fullResponse,
            reasoning: fullReasoning,
            status: back.type == "finish" ? "completed" : "generating",
            tokensUsed: back.tokensUsed,
          });
          lastSaveLength = fullResponse.length;
        }
        if (back.type == "finish") {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(message.id, chunk);
          MessageStreamManager.completeStream(message.id);
          res.end();
        }
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "服务器繁忙",
            requestId,
          ),
        );
    }
  }

  // ===== 新增接口：断点续传 =====
  static resumeChatHandler = async (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { messageId } = req.body;

    const message = await MessageService.getMessageById(messageId, userId);

    try {
      if (!message) {
        return res
          .status(404)
          .json(
            ResponseUtil.error(
              BusinessCode.RESOURCE_NOT_FOUND,
              "消息不存在",
              requestId,
            ),
          );
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // 2. 检查消息是否已完成生成
      if (message.status === "completed") {
        res.write(
          `${JSON.stringify({
            type: "content",
            messageId,
            content: message.content,
            reasoning: message.reasoning,
          })}\n\n`,
        );
        res.write(`${JSON.stringify({ type: "finish", messageId })}\n\n`);
        return res.end();
      }
      const stream = MessageStreamManager.getStream(messageId);
      // 3. 消息还在生成中，返回剩余内容
      if (!stream || stream.status === "completed") {
        if (stream && stream.buffer.length) {
          stream.buffer.forEach((chunk: any) => {
            if (chunk.type === "finish") {
              res.write(`${JSON.stringify(chunk)}\n\n`);
              res.end();
            } else {
              res.write(`${JSON.stringify(chunk)}\n\n`);
            }
          });
          // 若缓冲区最后不是 finish，手动补一个
          if (stream.buffer[stream.buffer.length - 1]?.type !== "finish") {
            res.write(`${JSON.stringify({ type: "finish", messageId })}\n\n`);
            res.end();
          }
        } else {
          // 没有流，但消息状态是 generating，可能异常
          res.write(`${JSON.stringify({ type: "error", messageId })}\n\n`);
          res.end();
        }
        return;
      }

      // 1. 先发送缓冲区中已有的内容
      let hasFinishInBuffer = false;
      for (const chunk of stream.buffer) {
        if (chunk.type === "finish") {
          hasFinishInBuffer = true;
          res.write(`${JSON.stringify(chunk)}\n\n`);
          break; // finish 后不再有其它数据
        } else if (
          chunk.type === "content" ||
          chunk.type === "reasoning_content"
        ) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
        }
      }

      if (hasFinishInBuffer) {
        return res.end(); // 已结束，不再监听
      }

      // 2. 注册新的监听器
      const listenerId = MessageStreamManager.addListener(
        messageId,
        (chunk: any) => {
          if (res.writableEnded) return;

          if (chunk.type === "finish") {
            res.write(
              `${JSON.stringify({
                type: "finish",
                messageId: messageId,
              })}\n\n`,
            );
            res.end();
          } else if (
            chunk.type === "content" ||
            chunk.type === "reasoning_content"
          ) {
            res.write(
              `${JSON.stringify({
                ...chunk,
                // 可选：标记为重连数据
                // isResume: true,
              })}\n\n`,
            );
          }
        },
      );

      if (listenerId) {
        req.on("close", () => {
          MessageStreamManager.removeListener(messageId, listenerId);
        });
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "服务器繁忙",
            requestId,
          ),
        );
    }
  };

  static async reGenerate(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { messageId, conversationId } = req.body;
    const SAVE_CHUNK_SIZE = 100; // 每100字符保存一次
    let lastSaveLength = 0;
    let fullResponse = "";
    let fullReasoning = "";

    const message = await MessageService.getMessageById(messageId, userId);
    if (!message) {
      return ResponseUtil.error(
        BusinessCode.RESOURCE_NOT_FOUND,
        "Message not found",
        requestId,
      );
    }
    await MessageService.deleteMessage(message.id, userId, true);

    const context = await MessageService.getConversationContext(
      conversationId as string,
      userId,
    );
    if (!context) {
      return ResponseUtil.error(
        BusinessCode.RESOURCE_NOT_FOUND,
        "Conversation not found",
      );
    }

    const options = {
      ...context.settings,
      messages: context.messages,
      model: context.conversation.model,
    };

    try {
      const newMessage = await MessageService.createMessage(conversationId, {
        role: "assistant",
        content: "",
        reasoning: "",
        status: "generating",
      });
      // 注册到流管理器
      MessageStreamManager.createStream(newMessage.id);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders(); // 立即发送头部

      await sendToDeepSeekStream(options, (back) => {
        const chunk = {
          ...back,
          messageId: newMessage.id,
          position: fullResponse.length,
        };
        if (back.type == "content" && back.content) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(newMessage.id, chunk);
          fullResponse += back.content;
        }
        if (back.type == "reasoning_content" && back.content) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(newMessage.id, chunk);
          fullReasoning += back.content;
        }
        const shouldSaveBySize =
          back.type === "finish" ||
          fullResponse.length - lastSaveLength >= SAVE_CHUNK_SIZE;
        if (shouldSaveBySize || back.type == "finish") {
          newMessage.update({
            content: fullResponse,
            reasoning: fullReasoning,
            status: back.type == "finish" ? "completed" : "generating",
            tokensUsed: back.tokensUsed,
          });
          lastSaveLength = fullResponse.length;
        }
        if (back.type == "finish") {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(newMessage.id, chunk);
          MessageStreamManager.completeStream(newMessage.id);
          res.end();
        }
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "服务器繁忙",
            requestId,
          ),
        );
    }
  }

  /**
   * 编辑消息并重新生成：更新消息内容 → 删除后续消息 → AI 重新生成回复
   */
  static async editAndRegenerate(req: Request, res: Response) {
    const requestId = req.headers["x-request-id"] as string;
    const userId = req.user!.id;
    const { messageId, conversationId, content } = req.body;
    const SAVE_CHUNK_SIZE = 100;
    let lastSaveLength = 0;
    let fullResponse = "";
    let fullReasoning = "";

    // 1. 更新消息内容
    const updatedMessage = await MessageService.updateMessage(
      messageId,
      userId,
      { content },
    );
    if (!updatedMessage) {
      return res
        .status(404)
        .json(
          ResponseUtil.error(
            BusinessCode.RESOURCE_NOT_FOUND,
            "消息不存在",
            requestId,
          ),
        );
    }

    // 2. 删除该消息之后的所有消息（不删自身）
    await MessageService.deleteMessage(messageId, userId, true);

    // 3. 获取上下文
    const context = await MessageService.getConversationContext(
      conversationId as string,
      userId,
    );
    if (!context) {
      return res
        .status(404)
        .json(
          ResponseUtil.error(
            BusinessCode.RESOURCE_NOT_FOUND,
            "会话不存在",
            requestId,
          ),
        );
    }

    const options = {
      ...context.settings,
      messages: context.messages,
      model: context.conversation.model,
    };

    try {
      const newMessage = await MessageService.createMessage(conversationId, {
        role: "assistant",
        content: "",
        reasoning: "",
        status: "generating",
      });
      MessageStreamManager.createStream(newMessage.id);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      await sendToDeepSeekStream(options, (back) => {
        const chunk = {
          ...back,
          messageId: newMessage.id,
          position: fullResponse.length,
        };
        if (back.type == "content" && back.content) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(newMessage.id, chunk);
          fullResponse += back.content;
        }
        if (back.type == "reasoning_content" && back.content) {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(newMessage.id, chunk);
          fullReasoning += back.content;
        }
        const shouldSaveBySize =
          back.type === "finish" ||
          fullResponse.length - lastSaveLength >= SAVE_CHUNK_SIZE;
        if (shouldSaveBySize || back.type == "finish") {
          newMessage.update({
            content: fullResponse,
            reasoning: fullReasoning,
            status: back.type == "finish" ? "completed" : "generating",
            tokensUsed: back.tokensUsed,
          });
          lastSaveLength = fullResponse.length;
        }
        if (back.type == "finish") {
          res.write(`${JSON.stringify(chunk)}\n\n`);
          MessageStreamManager.pushChunk(newMessage.id, chunk);
          MessageStreamManager.completeStream(newMessage.id);
          res.end();
        }
      });
    } catch (error) {
      console.error("编辑并重新生成失败:", error);
      res
        .status(500)
        .json(
          ResponseUtil.error(
            BusinessCode.SYSTEM_ERROR,
            "服务器繁忙",
            requestId,
          ),
        );
    }
  }
}
