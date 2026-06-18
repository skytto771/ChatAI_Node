// models/UserConversationSetting.ts
import { Sequelize, DataTypes, Model, Optional } from "sequelize";
import type { User } from "./User";

// ========== 1. 定义字段属性接口 ==========
export interface UserConversationSettingAttributes {
  id: string;
  userId: string;
  
  // 上下文配置
  contextLimit: number;           // 记忆限制
  maxTokens: number;              // 单次回复最大token
  
  // 思考模式配置
  isThinking: boolean;
  thinkingMode: "fast" | "balanced" | "deep";
  
  // 功能开关
  enableWebSearch: boolean;       // 联网搜索
  enableCodeInterpreter: boolean; // 代码解释器
  enableFileUpload: boolean;      // 文件上传
  
  // 模型参数
  temperature: number;            // 温度 0-2
  topP: number;                   // 核采样 0-1
  logprobs: boolean;
  topLogprobs: number;
  
  // 响应配置
  responseFormat: "text" | "json" | "markdown";
  streamResponse: boolean;        // 是否流式响应
  
  // 安全配置
  contentFilter: "strict" | "moderate" | "loose";
  
  createdAt?: Date;
  updatedAt?: Date;
}

// ========== 2. 创建时可选的字段 ==========
export interface UserConversationSettingCreationAttributes extends Optional<
  UserConversationSettingAttributes,
  "id" | "contextLimit" | "maxTokens" | "thinkingMode" | "enableWebSearch" | 
  "enableCodeInterpreter" | "enableFileUpload" | "temperature" | "topP" | "topLogprobs" | "responseFormat" | "streamResponse" | "contentFilter"
> {}

// ========== 3. 扩展 Model 类 ==========
export class UserConversationSetting
  extends Model<UserConversationSettingAttributes, UserConversationSettingCreationAttributes>
  implements UserConversationSettingAttributes
{
  declare id: string;
  declare userId: string;
  
  // 上下文配置
  declare contextLimit: number;
  declare maxTokens: number;
  
  // 思考模式配置
  declare isThinking: boolean;
  declare thinkingMode: "fast" | "balanced" | "deep";
  
  // 功能开关
  declare enableWebSearch: boolean;
  declare enableCodeInterpreter: boolean;
  declare enableFileUpload: boolean;
  
  // 模型参数
  declare temperature: number;
  declare topP: number;
  declare logprobs: boolean;
  declare topLogprobs: number;
  
  // 响应配置
  declare responseFormat: "text" | "json" | "markdown";
  declare streamResponse: boolean;
  
  // 安全配置
  declare contentFilter: "strict" | "moderate" | "loose";
  
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  
  // 关联属性
  declare user?: User;
  
  // ====== 实例方法 ======
  
  /**
   * 获取用户的会话设置（如果不存在则创建默认设置）
   */
  static async getSettings(userId: string): Promise<UserConversationSetting> {
    let settings = await UserConversationSetting.findOne({
      where: { userId },
    });
    
    if (!settings) {
      settings = await UserConversationSetting.create({
        userId,
        contextLimit: 16384,
        maxTokens: 4096,
        isThinking: false,
        thinkingMode: "fast",
        enableWebSearch: false,
        enableCodeInterpreter: false,
        enableFileUpload: false,
        temperature: 0.7,
        topP: 1.0,
        logprobs: false,
        topLogprobs: 0,
        responseFormat: "markdown",
        streamResponse: true,
        contentFilter: "moderate",
      });
    }
    
    return settings;
  }
  
  /**
   * 更新用户的会话设置
   */
  static async updateSettings(
    userId: string,
    updates: Partial<UserConversationSettingAttributes>
  ): Promise<UserConversationSetting> {
    const settings = await UserConversationSetting.getSettings(userId);
    await settings.update(updates);
    return settings;
  }
  
  /**
   * 重置为用户默认设置
   */
  static async resetToDefault(userId: string): Promise<UserConversationSetting> {
    const defaultSettings: Partial<UserConversationSettingAttributes> = {
      contextLimit: 20,
      maxTokens: 2048,
      thinkingMode: "balanced",
      enableWebSearch: false,
      enableCodeInterpreter: false,
      enableFileUpload: true,
      temperature: 0.7,
      topP: 1.0,
      responseFormat: "markdown",
      streamResponse: true,
      contentFilter: "moderate",
    };
    
    const settings = await UserConversationSetting.getSettings(userId);
    await settings.update(defaultSettings);
    return settings;
  }
  
  // ====== 静态关联方法 ======
  static associate(models: any) {
    UserConversationSetting.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

// ========== 4. 初始化函数 ==========
export default function initUserConversationSetting(
  sequelize: Sequelize
): typeof UserConversationSetting {
  UserConversationSetting.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        comment: "设置ID",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        comment: "用户ID",
        references: {
          model: "users",
          key: "id",
        },
      },
      
      // 上下文配置
      contextLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4096,
        field: "context_limit",
        validate: {
          min: 1024,
          max: 1048576,
        },
        comment: "上下文窗口大小（消息条数）",
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2048,
        field: "max_tokens",
        validate: {
          min: 1024,
          max: 1048576,
        },
        comment: "单次回复最大token数",
      },
      
      // 思考模式配置
      isThinking: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_thinking",
        comment: "是否启用思考模式",
      },
      thinkingMode: {
        type: DataTypes.ENUM("fast", "balanced", "deep"),
        allowNull: false,
        defaultValue: "balanced",
        field: "thinking_mode",
        comment: "思考模式：快速/平衡/深度",
      },
      
      // 功能开关
      enableWebSearch: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "enable_web_search",
        comment: "是否启用联网搜索",
      },
      enableCodeInterpreter: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "enable_code_interpreter",
        comment: "是否启用代码解释器",
      },
      enableFileUpload: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "enable_file_upload",
        comment: "是否启用文件上传",
      },
      
      // 模型参数
      temperature: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.7,
        validate: {
          min: 0,
          max: 2,
        },
        comment: "温度参数（0-2）",
      },
      topP: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 1.0,
        field: "top_p",
        validate: {
          min: 0,
          max: 1,
        },
        comment: "核采样参数（0-1）",
      },
      logprobs: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "是否返回所输出 token 的对数概率",
      },
      topLogprobs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "top_logprobs",
        comment: "指定每个输出位置返回输出概率 top N 的 token",
      },
      
      // 响应配置
      responseFormat: {
        type: DataTypes.ENUM("text", "json", "markdown"),
        allowNull: false,
        defaultValue: "markdown",
        field: "response_format",
        comment: "响应格式",
      },
      streamResponse: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "stream_response",
        comment: "是否启用流式响应",
      },
      
      // 安全配置
      contentFilter: {
        type: DataTypes.ENUM("strict", "moderate", "loose"),
        allowNull: false,
        defaultValue: "moderate",
        field: "content_filter",
        comment: "内容过滤级别",
      },
    },
    {
      sequelize,
      tableName: "user_conversation_settings",
      timestamps: true,
      underscored: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id"],
          name: "idx_user_settings_unique",
        },
      ],
    }
  );
  
  return UserConversationSetting;
}