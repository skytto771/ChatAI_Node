// models/Message.ts
import {
  Sequelize,
  DataTypes,
  Model,
  Optional,
  BelongsToGetAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyCreateAssociationMixin,
  NonAttribute,
} from "sequelize";
import type { Conversation } from "./Conversation";
import type { MessageFile } from "./MessageFile";

// ========== 1. 定义字段属性接口 ==========
export interface MessageAttributes {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning: string | null;
  tokensUsed: number;
  status: 'completed' | 'generating';
  createdAt?: Date;
  updatedAt?: Date;
}

// ========== 2. 创建时可选的字段 ==========
export interface MessageCreationAttributes extends Optional<
  MessageAttributes,
  "id" | "tokensUsed"
> {}

// ========== 3. 扩展 Model 类 ==========
export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  declare id: string;
  declare conversationId: string;
  declare role: "user" | "assistant" | "system";
  declare content: string;
  declare reasoning: string | null;
  declare tokensUsed: number;
  declare status: 'completed' | 'generating';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // 关联属性
  declare conversation?: NonAttribute<Conversation>;
  declare messageFiles?: NonAttribute<MessageFile[]>;

  // 关联方法
  declare getConversation: BelongsToGetAssociationMixin<Conversation>;
  declare getMessageFiles: HasManyGetAssociationsMixin<MessageFile>;
  declare createMessageFile: HasManyCreateAssociationMixin<MessageFile>;

  // ====== 实例方法 ======

  toJSON(this: Message): Omit<MessageAttributes, "">{
    const values = { ...this.get() };
    return values as Omit<MessageAttributes, "">;
  }
  /**
   * 获取消息内容预览
   */
  getContentPreview(maxLength: number = 100): string {
    if (this.content.length <= maxLength) return this.content;
    return this.content.substring(0, maxLength) + "...";
  }

  /**
   * 检查是否为用户消息
   */
  isUserMessage(): boolean {
    return this.role === "user";
  }

  /**
   * 检查是否为AI回复
   */
  isAssistantMessage(): boolean {
    return this.role === "assistant";
  }

  /**
   * 获取关联的文件列表（通过 message_files 表）
   */
  async getFiles(): Promise<any[]> {
    const messageFiles = await this.getMessageFiles({
      include: ["file"],
    });
    return messageFiles.map((mf) => (mf as any).file).filter(Boolean);
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    Message.belongsTo(models.Conversation, {
      foreignKey: "conversation_id",
      as: "conversation",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Message.hasMany(models.MessageFile, {
      foreignKey: "message_id",
      as: "messageFiles",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }

  /**
   * 获取会话的历史消息（用于构建 AI 上下文）
   */
  static async getConversationHistory(
    conversationId: number,
    limit: number = 20,
    includeSystem: boolean = true,
  ): Promise<Message[]> {
    const where: any = { conversationId };

    if (!includeSystem) {
      where.role = { [require("sequelize").Op.in]: ["user", "assistant"] };
    }

    return await Message.findAll({
      where,
      order: [["created_at", "ASC"]],
      limit,
    });
  }

  /**
   * 获取会话的最后一条消息
   */
  static async getLastMessage(conversationId: number): Promise<Message | null> {
    return await Message.findOne({
      where: { conversationId },
      order: [["created_at", "DESC"]],
    });
  }

  /**
   * 构建 AI API 所需的消息格式
   */
  static toOpenAIFormat(
    messages: Message[],
  ): Array<{ role: string; content: string }> {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }
}

export default function initMessage(sequelize: Sequelize): typeof Message {
  Message.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "消息ID",
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "conversation_id",
        comment: "所属会话ID",
        references: {
          model: "conversations",
          key: "id",
        },
      },
      role: {
        type: DataTypes.ENUM("user", "assistant", "system"),
        allowNull: false,
        comment: "消息角色",
        validate: {
          isIn: [["user", "assistant", "system"]],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "消息内容（支持Markdown）",
        // validate: {
        //   notEmpty: true,
        // },
      },
      reasoning: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "AI生成的 reasoning",
      },
      tokensUsed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: "tokens_used",
        comment: "该条消息消耗的Token数",
      },
      status: {
        type: DataTypes.ENUM("completed", "generating"),
        allowNull: false,
        defaultValue: "generating",
        comment: "消息状态",
      },

    },
    {
      sequelize,
      tableName: "messages",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ["conversation_id"], name: "idx_conversation_id" },
        { fields: ["created_at"], name: "idx_created_at" },
        {
          fields: ["conversation_id", "created_at"],
          name: "idx_conversation_created",
        },
      ],
    },
  );

  return Message;
}
