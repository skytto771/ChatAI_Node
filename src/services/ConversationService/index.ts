// services/ConversationService.ts
import { Op } from "sequelize";
import { Conversation, Message, UserConversationSetting, ConversationSetting } from "@/models";

type ConversationInstance = InstanceType<typeof Conversation>

export class ConversationService {
    /**
     * 创建新会话
     */
    static async createConversation(
        userId: string,
        data: Partial<ConversationInstance>
    ): Promise<ConversationInstance> {
        const conversation = await Conversation.create({
            userId,
            title: data.title || "新对话",
            model: data.model || "deepseek-v4-flash",
            tokenCount: 0,
            isArchived: false,
            isTop: false,
        });

        const userScSettings = await UserConversationSetting.getSettings(userId);
        await ConversationSetting.getSettings(conversation.id,userScSettings);
        return conversation;
    }

    /**
     * 获取会话详情
     */
    static async getConversationById(
        conversationId: string,
        userId: string
    ): Promise<ConversationInstance | null> {
        const conversation = await Conversation.findOne({
            where: {
                id: conversationId,
                userId,
            },
            include: [
                {
                    model: Message,
                    as: "messages",
                    order: [["created_at", "ASC"]],
                },
                {
                    model: ConversationSetting,
                    as: "setting",
                }
            ],
        });
        return conversation;
    }

    /**
     * 获取用户的会话列表
     */
    static async getUserConversations(
        userId: string,
        options: {
            isArchived?: boolean;
            keyword?: string;
        } = {}
    ): Promise<{ rows: ConversationInstance[]; count: number }> {
        const { isArchived, keyword } = options;

        const where: any = { userId };

        if (isArchived !== undefined) {
            where.isArchived = isArchived;
        }

        if (keyword) {
            where.title = {
                [Op.like]: `%${keyword}%`,
            };
        }

        const result = await Conversation.findAndCountAll({
            where,
            order: [["updated_at", "DESC"]],
            include:[
                {
                    model: ConversationSetting,
                    as: "setting",
                }
            ]
        });

        return result;
    }

    /**
     * 更新会话信息
     */
    static async updateConversation(
        conversationId: string,
        userId: string,
        updates: Partial<ConversationInstance>
    ): Promise<ConversationInstance | null> {
        const conversation = await Conversation.findOne({
            where: { id: conversationId, userId },
        });

        if (!conversation) {
            return null;
        }

        const allowedUpdates: (keyof ConversationInstance)[] = ["title", "model"];
        const updateData: any = {};

        allowedUpdates.forEach((field) => {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        });

        if (Object.keys(updateData).length > 0) {
            await conversation.update(updateData);
        }

        return conversation;
    }

    /**
     * 归档/取消归档会话
     */
    static async toggleArchive(
        conversationId: string,
        userId: string,
        isArchived: boolean
    ): Promise<ConversationInstance | null> {
        const conversation = await Conversation.findOne({
            where: { id: conversationId, userId },
        });

        if (!conversation) {
            return null;
        }

        await conversation.update({ isArchived });
        return conversation;
    }

    /**
     * 删除会话（软删除或硬删除）
     */
    static async deleteConversation(
        conversationId: string,
        userId: string,
    ): Promise<boolean> {
        const conversation = await Conversation.findOne({
            where: { id: conversationId, userId },
        });

        if (!conversation) {
            return false;
        }

        await conversation.destroy();

        return true;
    }

    /**
     * 更新会话的 Token 计数
     */
    static async updateTokenCount(
        conversationId: string,
        additionalTokens: number
    ): Promise<void> {
        await Conversation.increment(
            { tokenCount: additionalTokens },
            { where: { id: conversationId } }
        );
    }

    /**
     * 批量删除用户的归档会话
     */
    static async deleteArchivedConversations(userId: string): Promise<number> {
        const result = await Conversation.destroy({
            where: {
                userId,
                isArchived: true,
            },
        });
        return result;
    }

    /**
     * 获取会话统计信息
     */
    static async getConversationStats(userId: string): Promise<{
        total: number;
        active: number;
        archived: number;
        totalMessages: number;
        totalTokens: number;
    }> {
        const conversations = await Conversation.findAll({
            where: { userId },
            attributes: ["id", "isArchived", "tokenCount"],
        });

        const activeCount = conversations.filter(c => !c.isArchived).length;
        const archivedCount = conversations.filter(c => c.isArchived).length;

        let totalMessages = 0;
        for (const conv of conversations) {
            const msgCount = await conv.countMessages();
            totalMessages += msgCount;
        }

        const totalTokens = conversations.reduce((sum, c) => sum + (c.tokenCount || 0), 0);

        return {
            total: conversations.length,
            active: activeCount,
            archived: archivedCount,
            totalMessages,
            totalTokens,
        };
    }
}