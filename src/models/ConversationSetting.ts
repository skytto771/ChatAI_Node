// models/ConversationSetting.ts
import {
    Sequelize,
    DataTypes,
    Model,
    Optional,
    BelongsToGetAssociationMixin,
    NonAttribute,
} from "sequelize";
import type { Conversation } from "./Conversation";
import type { UserConversationSetting } from "./UserConversationSetting";

// ========== 可覆盖的对话级设置字段 ==========
export interface ConversationSettingAttributes {
    id: string;
    conversationId: string;
    systemPrompt: string;
    userPrompt: string;

    // 上下文配置（null 表示继承用户级设置）
    contextLimit: number;
    maxTokens: number;

    // 思考模式
    isThinking: boolean;
    thinkingMode: "fast" | "balanced" | "deep";

    // 功能开关
    enableWebSearch: boolean;
    enableCodeInterpreter: boolean;
    enableFileUpload: boolean;

    // 模型参数
    temperature: number;          // 0-2
    topP: number;                 // 0-1
    logprobs: boolean;
    topLogprobs: number;

    // 响应配置
    responseFormat: "text" | "json" | "markdown";
    streamResponse: boolean;

    // 安全配置
    contentFilter: "strict" | "moderate" | "loose";

    createdAt?: Date;
    updatedAt?: Date;
}

// ========== 创建时可选的字段 ==========
export interface ConversationSettingCreationAttributes
    extends Optional<
        ConversationSettingAttributes,
        | "id"
        | "contextLimit"
        | "maxTokens"
        | "thinkingMode"
        | "enableWebSearch"
        | "enableCodeInterpreter"
        | "enableFileUpload"
        | "temperature"
        | "topP"
        | "logprobs"
        | "topLogprobs"
        | "responseFormat"
        | "streamResponse"
        | "contentFilter"
        | "systemPrompt"
        | "userPrompt"
    > {}

// ========== 模型类 ==========
export class ConversationSetting
    extends Model<
        ConversationSettingAttributes,
        ConversationSettingCreationAttributes
    >
    implements ConversationSettingAttributes
{
    declare id: string;
    declare conversationId: string;
    declare systemPrompt: string;
    declare userPrompt: string;

    declare contextLimit: number;
    declare maxTokens: number;
    declare isThinking: boolean;
    declare thinkingMode: "fast" | "balanced" | "deep";
    declare enableWebSearch: boolean;
    declare enableCodeInterpreter: boolean;
    declare enableFileUpload: boolean;
    declare temperature: number;
    declare topP: number;
    declare logprobs: boolean;
    declare topLogprobs: number;
    declare responseFormat: "text" | "json" | "markdown";
    declare streamResponse: boolean;
    declare contentFilter: "strict" | "moderate" | "loose";

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    // 关联声明
    declare conversation?: NonAttribute<Conversation>;
    declare getConversation: BelongsToGetAssociationMixin<Conversation>;

    // ====== 实例方法 ======
    toJSON(this: ConversationSetting): Omit<ConversationSettingAttributes, ""> {
        const values = { ...this.get() };
        return values as Omit<ConversationSettingAttributes, "">;
    }

    // ====== 静态方法 ======

    /**
     * 获取某个对话的设置（不存在则创建默认全继承）
     */
    static async getSettings(
        conversationId: string,
        modelSetting: UserConversationSetting
    ): Promise<ConversationSetting> {
        let settings = await ConversationSetting.findOne({
            where: { conversationId },
        });

        if (!settings) {
            settings = await ConversationSetting.create({
                conversationId,
                // 全部 null，表示全部继承用户设置
                contextLimit: modelSetting?.contextLimit || 8096,
                maxTokens: modelSetting?.maxTokens || 2048,
                isThinking: modelSetting?.isThinking || false,
                thinkingMode: modelSetting?.thinkingMode || 'fast',
                enableWebSearch: modelSetting?.enableWebSearch || false,
                enableCodeInterpreter: modelSetting?.enableCodeInterpreter || false,
                enableFileUpload: modelSetting?.enableFileUpload || false,
                temperature: modelSetting?.temperature || 0.7,
                topP: modelSetting?.topP || 1,
                logprobs: modelSetting?.logprobs || false,
                topLogprobs: modelSetting?.topLogprobs || 0,
                responseFormat: modelSetting?.responseFormat,
                streamResponse: modelSetting?.streamResponse || true,
                contentFilter: modelSetting?.contentFilter,
            });
        }

        return settings;
    }

    /**
     * 更新某个对话的设置
     */
    static async updateSettings(
        conversationId: string,
        updates: Partial<ConversationSettingAttributes>
    ): Promise<ConversationSetting> {
        const settings = await ConversationSetting.findOne({
            where: { conversationId },
        });
        if (!settings) {
            throw new Error("Conversation settings not found");
        }
        await settings.update(updates);
        return settings;
    }

    // ====== 关联定义 ======
    static associate(models: any) {
        ConversationSetting.belongsTo(models.Conversation, {
            foreignKey: "conversation_id",
            as: "conversation",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
    }
}

// ========== 初始化函数 ==========
export default function initConversationSetting(
    sequelize: Sequelize
): typeof ConversationSetting {
    ConversationSetting.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                comment: "设置ID",
            },
            conversationId: {
                type: DataTypes.UUID,
                allowNull: false,
                field: "conversation_id",
                unique: true,
                comment: "所属对话ID",
                references: {
                    model: "conversations",
                    key: "id",
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
            contextLimit: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "context_limit",
                comment: "上下文窗口大小，null 使用用户级",
                validate: { 
                    min: 1024,
                    max: 1048576,
                 },
            },
            maxTokens: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "max_tokens",
                comment: "单次回复最大 token，null 使用用户级",
                validate: { 
                    min: 1024,
                    max: 1048576, 
                },
            },
            isThinking: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                field: "is_thinking",
                comment: "是否启用思考模式",
            },
            thinkingMode: {
                type: DataTypes.ENUM("fast", "balanced", "deep"),
                allowNull: true,
                field: "thinking_mode",
                comment: "思考模式，null 使用用户级",
            },
            enableWebSearch: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                field: "enable_web_search",
                comment: "联网搜索，null 使用用户级",
            },
            enableCodeInterpreter: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                field: "enable_code_interpreter",
                comment: "代码解释器，null 使用用户级",
            },
            enableFileUpload: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                field: "enable_file_upload",
                comment: "文件上传，null 使用用户级",
            },
            temperature: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: true,
                comment: "温度 0-2，null 使用用户级",
                validate: { min: 0, max: 2 },
            },
            topP: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: true,
                field: "top_p",
                comment: "核采样 0-1，null 使用用户级",
                validate: { min: 0, max: 1 },
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
            responseFormat: {
                type: DataTypes.ENUM("text", "json", "markdown"),
                allowNull: true,
                field: "response_format",
                comment: "响应格式，null 使用用户级",
            },
            streamResponse: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                field: "stream_response",
                comment: "流式响应，null 使用用户级",
            },
            contentFilter: {
                type: DataTypes.ENUM("strict", "moderate", "loose"),
                allowNull: true,
                field: "content_filter",
                comment: "内容过滤级别，null 使用用户级",
            },
        },
        {
            sequelize,
            tableName: "conversation_settings",
            timestamps: true,
            underscored: true,
            paranoid: false,
            indexes: [
                {
                    unique: true,
                    fields: ["conversation_id"],
                    name: "idx_conversation_settings_unique",
                },
            ],
        }
    );

    return ConversationSetting;
}