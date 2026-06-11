// models/MessageFile.ts
import {
  Sequelize,
  DataTypes,
  Model,
  Optional,
  BelongsToGetAssociationMixin,
  NonAttribute,
} from "sequelize";
import type { Message } from "./Message";
import type { File } from "./File";

// ========== 1. 定义字段属性接口 ==========
export interface MessageFileAttributes {
  id: string;
  messageId: string;
  fileId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ========== 2. 创建时可选的字段 ==========
export interface MessageFileCreationAttributes extends Optional<
  MessageFileAttributes,
  "id"
> {}

// ========== 3. 扩展 Model 类 ==========
export class MessageFile
  extends Model<MessageFileAttributes, MessageFileCreationAttributes>
  implements MessageFileAttributes
{
  declare id: string;
  declare messageId: string;
  declare fileId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // 关联属性
  declare message?: NonAttribute<Message>;
  declare file?: NonAttribute<File>;

  // 关联方法
  declare getMessage: BelongsToGetAssociationMixin<Message>;
  declare getFile: BelongsToGetAssociationMixin<File>;

  // ====== 实例方法 ======
  /**
   * 获取关联文件的详细信息
   */
  async getFileDetails(): Promise<File | null> {
    return await this.getFile();
  }

  /**
   * 获取关联消息的信息
   */
  async getMessageDetails(): Promise<Message | null> {
    return await this.getMessage();
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    MessageFile.belongsTo(models.Message, {
      foreignKey: "message_id",
      as: "message",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    MessageFile.belongsTo(models.File, {
      foreignKey: "file_id",
      as: "file",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }

  /**
   * 批量创建消息文件关联
   */
  static async batchCreate(
    messageId: string,
    fileIds: string[],
  ): Promise<MessageFile[]> {
    const messageFiles = fileIds.map((fileId) => ({
      messageId,
      fileId,
    }));

    return await MessageFile.bulkCreate(messageFiles, {
      ignoreDuplicates: true,
    });
  }

  /**
   * 获取某条消息的所有文件关联
   */
  static async getFilesByMessageId(messageId: string): Promise<MessageFile[]> {
    return await MessageFile.findAll({
      where: { messageId },
      include: ["file"],
    });
  }

  /**
   * 获取某个文件被引用的消息列表
   */
  static async getMessagesByFileId(fileId: number): Promise<MessageFile[]> {
    return await MessageFile.findAll({
      where: { fileId },
      include: ["message"],
    });
  }
}

export default function initMessageFile(
  sequelize: Sequelize,
): typeof MessageFile {
  MessageFile.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "关联记录ID",
      },
      messageId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "message_id",
        comment: "消息ID",
        references: {
          model: "messages",
          key: "id",
        },
      },
      fileId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "file_id",
        comment: "文件ID",
        references: {
          model: "files",
          key: "id",
        },
      },
    },
    {
      sequelize,
      tableName: "message_files",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ["message_id", "file_id"],
          name: "idx_message_file",
        },
        { fields: ["file_id"], name: "idx_file_id" },
      ],
    },
  );

  return MessageFile;
}
