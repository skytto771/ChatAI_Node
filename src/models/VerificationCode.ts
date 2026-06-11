// models/VerificationCode.ts
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

export interface VerificationCodeAttributes {
  id: string;
  user_id: number | null;
  contact: string;
  code: string;
  type: "email" | "phone";
  purpose: "register" | "login" | "reset_password" | "bind";
  expires_at: Date;
  verified_at: Date | null;
  created_at: Date;
}

export interface VerificationCodeCreationAttributes extends Optional<
  VerificationCodeAttributes,
  "id" | "verified_at" | "created_at"
> {}

export class VerificationCode extends Model<
  VerificationCodeAttributes,
  VerificationCodeCreationAttributes
> {
  declare id: string;
  declare user_id: number | null;
  declare contact: string;
  declare code: string;
  declare type: "email" | "phone";
  declare purpose: "register" | "login" | "reset_password" | "bind";
  declare expires_at: Date;
  declare verified_at: Date | null;
  declare created_at: Date;
}

export default function initVerificationCode(
  sequelize: Sequelize,
): typeof VerificationCode {
  VerificationCode.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        comment: "验证码ID",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        comment: "用户ID",
      },
      contact: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "联系方式",
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: "验证码",
      },
      type: {
        type: DataTypes.ENUM("email", "phone"),
        allowNull: false,
        comment: "联系方式类型",
      },
      purpose: {
        type: DataTypes.ENUM("register", "login", "reset_password", "bind"),
        allowNull: false,
        comment: "验证码用途",
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "验证码过期时间",
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "验证码验证时间",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: "创建时间",
      },
    },
    {
      sequelize,
      tableName: "verification_codes",
      timestamps: false,
      indexes: [
        {
          name: "idx_contact_purpose",
          fields: ["contact", "purpose", "type"],
        },
        {
          name: "idx_expires_at",
          fields: ["expires_at"],
        },
      ],
    },
  );
  return VerificationCode;
}
