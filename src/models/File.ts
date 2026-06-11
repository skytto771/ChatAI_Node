// models/File.ts
import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// ========== 1. 定义字段属性接口 ==========
export interface FileAttributes {
  id: string;
  userId: string;
  fileHash: string;
  fileName: string;
  originalName: string;
  purpose: "avatar" | "chat_attachment" | null;
  fileUrl: string | null;
  filePath: string | null;
  fileSize: number;
  mimeType: string;
  status: "completed" | "failed" | "uploading" | "pending";
  createdAt?: Date;
  updatedAt?: Date;
}

// ========== 2. 创建时可选的字段（如自增 id） ==========
export interface FileCreationAttributes extends Optional<
  FileAttributes,
  "id" | "fileUrl" | "filePath" | "purpose"
> {}

// ========== 3. 扩展 Model 类，声明实例方法和静态方法 ==========
export class File
  extends Model<FileAttributes, FileCreationAttributes>
  implements FileAttributes
{
  // 字段声明（必须，才能通过 this.xxx 访问）
  declare id: string;
  declare userId: string;
  declare fileHash: string;
  declare fileName: string;
  declare originalName: string;
  declare fileUrl: string | null;
  declare filePath: string | null;
  declare fileSize: number;
  declare mimeType: string;
  declare purpose: "avatar" | "chat_attachment";
  declare status: "completed" | "failed" | "uploading" | "pending";
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // ====== 实例方法 ======
  toJSON(this: File): Omit<FileAttributes, "fileHash" | "filePath"> {
    const values = this.get({ plain: true }) as Record<string, any>;
    delete values.fileHash;
    delete values.filePath;
    return values as Omit<FileAttributes, "fileHash" | "filePath">;
  }

  // 示例：获取文件的分片
  async getFileChunks(this: File) {
    const fileChunks = await (this.sequelize!.models.FileChunk as any).findAll({
      where: { fileId: this.id },
      attributes: { exclude: ["chunkPath"] },
    });
    return fileChunks;
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    // 这里需要引入关联类型，见后文说明
    File.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    File.hasMany(models.UserAvatar, {
      foreignKey: "file_id",
      as: "avatars",
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  }

  static async findOneSafe(options: any): Promise<File | null> {
    try {
      return await File.findOne({
        ...options,
        attributes: { exclude: ["file_hash"] },
      });
    } catch (error) {
      throw new Error(`查找文件失败: ${(error as Error).message}`);
    }
  }

  static async findAllSafe(options: any = {}): Promise<File[]> {
    try {
      return await File.findAll({
        ...options,
        attributes: { exclude: ["file_hash"] },
      });
    } catch (error) {
      throw new Error(`查找文件列表失败: ${(error as Error).message}`);
    }
  }
}

export default function initFile(sequelize: Sequelize) {
  File.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "文件ID",
      },
      userId: {
        // ✅ 必须有：谁上传的
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
        comment: "上传用户ID",
        references: {
          model: "users",
          key: "id",
        },
      },
      fileHash: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: "file_hash",
        comment: "文件MD5值",
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "file_name",
        comment: "存储文件名",
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "original_name",
        comment: "原始文件名",
      },
      purpose: {
        type: DataTypes.ENUM("avatar", "chat_attachment"),
        allowNull: true,
        comment: "用途",
      },
      fileUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "file_url",
        comment: "文件访问URL",
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "file_path",
        comment: "物理存储路径（绝对路径或相对路径）",
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "file_size",
        comment: "文件大小",
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "mime_type",
        comment: "MIME类型",
      },
      status: {
        type: DataTypes.ENUM("completed", "failed", "uploading"),
        defaultValue: "uploading",
        comment: "文件状态",
      },
    },
    {
      sequelize,
      tableName: "files",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ["user_id"], name: "idx_user_id" }, // ✅ 查询用户文件
        { fields: ["file_hash"], name: "idx_file_hash" }, // ✅ 秒传
        { fields: ["status"], name: "idx_status" },
      ],
      hooks: {
        // beforeCreate: async (file)=>{}
      },
    },
  );
  return File;
}
