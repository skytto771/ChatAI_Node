// models/UserAvatar.ts
import {
  Sequelize,
  DataTypes,
  Model,
  Optional,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  BelongsToCreateAssociationMixin,
  NonAttribute,
} from "sequelize";

import type { User } from "./User";
import type { File } from "./File";

// ========== 接口定义 ==========
export interface UserAvatarAttributes {
  id: number;
  userId: number;
  fileId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserAvatarCreationAttributes extends Optional<
  UserAvatarAttributes,
  "id"
> {}

// ========== 模型类 ==========
class UserAvatar
  extends Model<UserAvatarAttributes, UserAvatarCreationAttributes>
  implements UserAvatarAttributes
{
  declare id: number;
  declare userId: number;
  declare fileId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // 关联属性（非数据库列，用于类型提示）
  declare user?: NonAttribute<User>;
  declare file?: NonAttribute<File>;

  // 关联方法类型声明（由 Sequelize 自动生成）
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, number>;
  declare createUser: BelongsToCreateAssociationMixin<User>;

  declare getFile: BelongsToGetAssociationMixin<File>;
  declare setFile: BelongsToSetAssociationMixin<File, number>;
  declare createFile: BelongsToCreateAssociationMixin<File>;

  // ====== 实例方法 ======
  /**
   * 获取头像的完整 URL（可根据业务需求扩展）
   * @param baseUrl - 应用基础 URL（如 http://localhost:3000）
   * @returns 头像 URL
   */
  async getAvatarUrl(baseUrl: string): Promise<string> {
    // 加载关联的 File 记录（如果尚未加载）
    let file = this.file;
    if (!file) {
      file = await this.getFile();
    }
    if (file && file.fileUrl) {
      // 假设 File 模型有 fileUrl 字段
      return file.fileUrl;
    }
    // 返回默认头像
    return `${baseUrl}/images/defaultAvatar.jpg`;
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    UserAvatar.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    UserAvatar.belongsTo(models.File, {
      foreignKey: "file_id",
      as: "file",
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  }
}

// ========== 初始化函数 ==========
export default function initUserAvatar(
  sequelize: Sequelize,
): typeof UserAvatar {
  UserAvatar.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: "头像记录ID",
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "user_id",
        comment: "用户ID",
        references: {
          model: "users",
          key: "id",
        },
      },
      fileId: {
        type: DataTypes.BIGINT,
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
      tableName: "user_avatars",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        { unique: true, fields: ["user_id"], name: "idx_user_id_unique" },
        { unique: true, fields: ["file_id"], name: "idx_file_id_unique" },
      ],
    },
  );

  return UserAvatar;
}
