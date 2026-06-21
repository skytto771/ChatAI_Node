// services/MessageService.ts
import { Op, fn, col } from "sequelize";
import {
  Message,
  Conversation,
  ConversationSetting,
  UserConversationSetting,
} from "@/models";
import { MessageAttributes, MessageCreationAttributes } from "@/models/Message";
import { ConversationSettingAttributes } from "@/models/ConversationSetting";
import { ConversationAttributes } from "@/models/Conversation";

type MessageInstance = InstanceType<typeof Message>;

export class MessageService {
  /**
   * 创建新消息
   */
  static async createMessage(
    conversationId: string,
    data: Partial<MessageCreationAttributes>,
  ): Promise<MessageInstance> {
    const conversation = await Conversation.findOne({
      where: { id: conversationId },
    });
    const count = await Message.count({
      where: {
        conversationId,
      },
    });
    if (count <= 0 && data.content) {
      await conversation!.update({
        title: data.content.substring(0, 20),
      });
    }

    const message = await Message.create({
      conversationId,
      role: data.role || "user",
      content: data.content || "",
      tokensUsed: data.tokensUsed || 0,
      status: data.status || "generating",
    });

    // 更新会话的更新时间
    await Conversation.update(
      { updatedAt: new Date() },
      { where: { id: conversationId } },
    );

    return message;
  }

  /**
   * 批量创建消息（用于一次AI回复）
   */
  static async createMessagesBatch(
    messages: Array<Partial<MessageCreationAttributes>>,
  ): Promise<MessageInstance[]> {
    const createdMessages = await Message.bulkCreate(messages as any);
    return createdMessages;
  }

  /**
   * 获取消息详情
   */
  static async getMessageById(
    messageId: string,
    userId: string,
  ): Promise<MessageInstance | null> {
    const message = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: Conversation,
          as: "conversation",
          where: { userId },
          attributes: ["id", "title"],
        },
      ],
    });
    return message;
  }

  /**
   * 获取会话的所有消息
   */
  static async getConversationMessages(
    conversationId: string,
    userId: string,
  ): Promise<{ rows: MessageInstance[]; count: number }> {
    // 先验证用户是否有权限访问该会话
    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return { rows: [], count: 0 };
    }

    const where: any = { conversationId };

    const result = await Message.findAndCountAll({
      where,
      order: [
        ["created_at", "ASC"],
        ["sort_seq", "ASC"],
      ],
    });

    return result;
  }

  /**
   * 获取会话上下文（历史与设置）
   */
  static async getConversationContext(
    conversationId: string,
    userId: string,
  ): Promise<{
    messages: MessageAttributes[];
    settings: ConversationSettingAttributes;
    conversation: ConversationAttributes;
  } | null> {
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return null;
    }
    const settings = await UserConversationSetting.getSettings(userId);

    const modelSetting = await ConversationSetting.getSettings(
      conversation.id,
      settings,
    );
    if (!modelSetting) {
      return null;
    }
    let messages = [];

    const options: any = {
      where: {
        conversationId: conversationId,
        role: { [Op.in]: ["user", "assistant", "system"] },
      },
      order: [
        ["created_at", "ASC"],
        ["sort_seq", "ASC"],
      ],
    };

    messages = await Message.findAll(options);

    const result = {
      messages: messages.map((message) => message.toJSON()),
      settings: modelSetting.toJSON(),
      conversation: conversation.toJSON(),
    };

    // // 如果需要按 token 数量裁剪
    // if (maxTokens) {
    //     let totalTokens = 0;
    //     const filteredMessages = [];

    //     for (let i = messages.length - 1; i >= 0; i--) {
    //         const msg = messages[i];
    //         const msgTokens = msg.tokensUsed || Math.ceil(msg.content.length / 4);

    //         if (totalTokens + msgTokens <= maxTokens) {
    //             totalTokens += msgTokens;
    //             filteredMessages.unshift(msg);
    //         } else {
    //             break;
    //         }
    //     }

    //     return filteredMessages;
    // }

    return result;
  }

  /**
   * 获取会话的最后一条消息
   */
  static async getLastMessage(
    conversationId: string,
    userId: string,
  ): Promise<MessageInstance | null> {
    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return null;
    }

    const message = await Message.findOne({
      where: { conversationId },
      order: [
        ["created_at", "DESC"],
        ["sort_seq", "DESC"],
      ],
    });

    return message;
  }

  /**
   * 更新消息内容（通常用于编辑用户消息）
   */
  static async updateMessage(
    messageId: string,
    userId: string,
    updates: Partial<MessageAttributes>,
  ): Promise<MessageInstance | null> {
    const message = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: Conversation,
          as: "conversation",
          where: { userId },
        },
      ],
    });

    if (!message) {
      return null;
    }

    // 只允许更新 content 和 tokensUsed
    const allowedUpdates: (keyof MessageAttributes)[] = [
      "content",
      "tokensUsed",
    ];
    const updateData: any = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length > 0) {
      await message.update(updateData);
    }

    return message;
  }

  /**
   * 删除消息（同时删除后续的AI回复）
   */
  static async deleteMessage(
    messageId: string,
    userId: string,
    deleteFollowing: boolean = false,
  ): Promise<{ deletedCount: number; message?: MessageInstance }> {
    const message = await Message.findOne({
      where: { id: messageId },
      include: [
        {
          model: Conversation,
          as: "conversation",
          where: { userId },
        },
      ],
    });

    if (!message) {
      return { deletedCount: 0 };
    }

    let deletedCount = 0;

    if (deleteFollowing) {
      // 删除该消息及其之后的所有消息
      const deleted = await Message.destroy({
        where: {
          conversationId: message.conversationId,
          createdAt: {
            [Op.gte]: message.updatedAt,
          },
        },
      });
      deletedCount = deleted;
    } else {
      await message.destroy();
      deletedCount = 1;
    }

    return { deletedCount, message };
  }

  /**
   * 清空会话的所有消息
   */
  static async clearConversationMessages(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return 0;
    }

    const deletedCount = await Message.destroy({
      where: { conversationId },
    });

    // 重置会话的 token 计数
    await conversation.update({ tokenCount: 0 });

    return deletedCount;
  }

  /**
   * 获取消息统计信息
   */
  static async getMessageStats(userId: string): Promise<{
    total: number;
    userMessages: number;
    assistantMessages: number;
    totalTokens: number;
  }> {
    const conversations = await Conversation.findAll({
      where: { userId },
      attributes: ["id"],
    });

    const conversationIds = conversations.map((c) => c.id);

    const stats = await Message.findAll({
      where: {
        conversationId: { [Op.in]: conversationIds },
      },
      attributes: [
        "role",
        [fn("SUM", col("tokensUsed")), "totalTokens"],
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["role"],
    });

    let userMessages = 0;
    let assistantMessages = 0;
    let totalTokens = 0;

    stats.forEach((stat: any) => {
      const role = stat.getDataValue("role");
      const count = parseInt(stat.getDataValue("count"));
      const tokens = parseInt(stat.getDataValue("totalTokens")) || 0;

      if (role === "user") userMessages = count;
      if (role === "assistant") assistantMessages = count;
      totalTokens += tokens;
    });

    const total = userMessages + assistantMessages;

    return {
      total,
      userMessages,
      assistantMessages,
      totalTokens,
    };
  }

  /**
   * 搜索消息内容
   */
  static async searchMessages(
    userId: string,
    keyword: string,
    options: {
      limit?: number;
      conversationId?: string;
    } = {},
  ): Promise<MessageInstance[]> {
    const { limit = 50, conversationId } = options;

    const conversationWhere: any = { userId };
    if (conversationId) {
      conversationWhere.id = conversationId;
    }

    const conversations = await Conversation.findAll({
      where: conversationWhere,
      attributes: ["id"],
    });

    const conversationIds = conversations.map((c) => c.id);

    if (conversationIds.length === 0) {
      return [];
    }

    const messages = await Message.findAll({
      where: {
        conversationId: { [Op.in]: conversationIds },
        content: { [Op.like]: `%${keyword}%` },
        role: { [Op.in]: ["user", "assistant"] },
      },
      order: [
        ["created_at", "DESC"],
        ["sort_seq", "DESC"],
      ],
      limit,
      include: [
        {
          model: Conversation,
          as: "conversation",
          attributes: ["id", "title"],
        },
      ],
    });

    return messages;
  }
}
