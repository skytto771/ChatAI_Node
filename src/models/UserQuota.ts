// models/UserQuota.ts
import { Sequelize, DataTypes, Model, Optional } from "sequelize";

// ========== 1. 定义字段属性接口 ==========
export interface UserQuotaAttributes {
  id: string;
  userId: string;
  tokenLimit: number;
  tokensUsed: number;
  resetDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ========== 2. 创建时可选的字段 ==========
export interface UserQuotaCreationAttributes extends Optional<
  UserQuotaAttributes,
  "id" | "tokenLimit" | "tokensUsed"
> {}

// ========== 3. 扩展 Model 类 ==========
export class UserQuota
  extends Model<UserQuotaAttributes, UserQuotaCreationAttributes>
  implements UserQuotaAttributes
{
  declare id: string;
  declare userId: string;
  declare tokenLimit: number;
  declare tokensUsed: number;
  declare resetDate: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // ====== 实例方法 ======
  /**
   * 检查是否还有可用额度
   */
  hasQuota(): boolean {
    return this.tokensUsed < this.tokenLimit;
  }

  /**
   * 获取剩余额度
   */
  remainingQuota(): number {
    return Math.max(0, this.tokenLimit - this.tokensUsed);
  }

  /**
   * 消耗 Token（需手动保存）
   */
  consumeTokens(tokens: number): void {
    this.tokensUsed += tokens;
  }

  /**
   * 重置月度额度
   */
  resetQuota(): void {
    this.tokensUsed = 0;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    this.resetDate = nextMonth;
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    UserQuota.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }

  /**
   * 查找或创建用户额度记录
   */
  static async findOrCreateQuota(
    userId: string,
    tokenLimit: number = 1000000,
  ): Promise<UserQuota> {
    const [quota] = await UserQuota.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        tokenLimit,
        tokensUsed: 0,
        resetDate: (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          date.setDate(1);
          return date;
        })(),
      },
    });

    // 检查是否需要重置月度额度
    if (quota.resetDate <= new Date()) {
      quota.resetQuota();
      await quota.save();
    }

    return quota;
  }

  /**
   * 尝试消耗 Token，返回是否成功
   */
  static async tryConsumeTokens(
    userId: string,
    tokens: number,
  ): Promise<{ success: boolean; quota: UserQuota }> {
    const quota = await UserQuota.findOrCreateQuota(userId);

    if (!quota.hasQuota()) {
      return { success: false, quota };
    }

    quota.consumeTokens(tokens);
    await quota.save();

    return { success: true, quota };
  }
}

export default function initUserQuota(sequelize: Sequelize): typeof UserQuota {
  UserQuota.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "额度记录ID",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: "user_id",
        comment: "用户ID",
        references: {
          model: "users",
          key: "id",
        },
      },
      tokenLimit: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: 1000000,
        field: "token_limit",
        comment: "每月Token限额",
        validate: {
          min: 0,
        },
      },
      tokensUsed: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: 0,
        field: "tokens_used",
        comment: "当月已使用Token数",
        validate: {
          min: 0,
        },
      },
      resetDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "reset_date",
        comment: "额度重置日期",
        validate: {
          isDate: true,
        },
      },
    },
    {
      sequelize,
      tableName: "user_quotas",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [{ unique: true, fields: ["user_id"], name: "idx_user_id" }],
      hooks: {
        beforeCreate: async (quota: UserQuota) => {
          // 确保 resetDate 至少是未来时间
          if (!quota.resetDate || quota.resetDate <= new Date()) {
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            date.setDate(1);
            quota.resetDate = date;
          }
        },
      },
    },
  );

  return UserQuota;
}
