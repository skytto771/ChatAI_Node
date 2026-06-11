// models/Conversation.ts
import {
  Sequelize,
  DataTypes,
  Model,
  Optional,
  HasManyGetAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  NonAttribute,
} from "sequelize";
import type { Message } from "./Message";

// ========== 1. 定义字段属性接口 ==========
export interface ConversationAttributes {
  id: string;
  userId: string;
  title: string;
  model: string;
  systemPrompt: string | null;
  userPrompt: string | null;
  tokenCount: number;
  isArchived: boolean;
  isTop: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ========== 2. 创建时可选的字段 ==========
export interface ConversationCreationAttributes extends Optional<
  ConversationAttributes,
  "id" | "title" | "systemPrompt" | "tokenCount" | "isArchived"
> {}

// ========== 3. 扩展 Model 类 ==========
export class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  declare id: string;
  declare userId: string;
  declare title: string;
  declare model: string;
  declare systemPrompt: string | null;
  declare userPrompt: string | null;
  declare tokenCount: number;
  declare isArchived: boolean;
  declare isTop: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // 关联属性
  declare messages?: NonAttribute<Message[]>;

  // 关联方法
  declare getMessages: HasManyGetAssociationsMixin<Message>;
  declare countMessages: HasManyCountAssociationsMixin;
  declare createMessage: HasManyCreateAssociationMixin<Message>;

  // ====== 实例方法 ======
  /**
   * 获取会话摘要（最近几条消息预览）
   */
  async getPreview(limit: number = 3): Promise<string> {
    const messages = await this.getMessages({
      where: { role: "user" },
      order: [["created_at", "DESC"]],
      limit,
    });

    if (messages.length === 0) return "新对话";

    return messages
      .reverse()
      .map((m) => m.content.substring(0, 50))
      .join(" | ");
  }

  /**
   * 获取会话消息总数
   */
  async getMessageCount(): Promise<number> {
    return await this.countMessages();
  }

  /**
   * 归档会话
   */
  async archive(): Promise<void> {
    this.isArchived = true;
    await this.save();
  }

  /**
   * 取消归档
   */
  async unarchive(): Promise<void> {
    this.isArchived = false;
    await this.save();
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    Conversation.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Conversation.hasMany(models.Message, {
      foreignKey: "conversation_id",
      as: "messages",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }

  /**
   * 获取用户的活跃会话列表
   */
  static async getActiveConversations(
    userId: number,
    limit: number = 20,
  ): Promise<Conversation[]> {
    return await Conversation.findAll({
      where: {
        userId,
        isArchived: false,
      },
      order: [["updated_at", "DESC"]],
      limit,
    });
  }

  /**
   * 获取用户的归档会话列表
   */
  static async getArchivedConversations(
    userId: number,
  ): Promise<Conversation[]> {
    return await Conversation.findAll({
      where: {
        userId,
        isArchived: true,
      },
      order: [["updated_at", "DESC"]],
    });
  }

  /**
   * 搜索用户的会话
   */
  static async searchConversations(
    userId: number,
    keyword: string,
  ): Promise<Conversation[]> {
    const { Op } = require("sequelize");
    return await Conversation.findAll({
      where: {
        userId,
        title: {
          [Op.like]: `%${keyword}%`,
        },
      },
      order: [["updated_at", "DESC"]],
    });
  }
}

export default function initConversation(
  sequelize: Sequelize,
): typeof Conversation {
  Conversation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "会话ID",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        comment: "所属用户ID",
        references: {
          model: "users",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "新对话",
        comment: "会话标题",
      },
      model: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "gpt-3.5-turbo",
        comment: "使用的AI模型",
        validate: {
          notEmpty: true,
        },
      },
      systemPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "system_prompt",
        comment: "会话级系统提示词",
      },
      userPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "user_prompt",
        comment: "会话级用户提示词",
      },
      tokenCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        field: "token_count",
        comment: "该会话累计消耗Token",
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_archived",
        comment: "是否归档",
      },
      isTop: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_top",
        comment: "是否置顶",
      },
    },
    {
      sequelize,
      tableName: "conversations",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ["user_id"], name: "idx_user_id" },
        { fields: ["created_at"], name: "idx_created_at" },
        { fields: ["is_archived"], name: "idx_is_archived" },
      ],
      hooks: {
        beforeCreate: async (conversation: Conversation) => {
          if (!conversation.title) {
            conversation.title = "新对话";
          }
        },
      },
    },
  );

  return Conversation;
}
