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

    // 上下文配置（null 表示继承用户级设置）
    contextLimit: number | null;
    maxTokens: number | null;

    // 思考模式
    thinkingMode: "fast" | "balanced" | "deep" | null;

    // 功能开关
    enableWebSearch: boolean | null;
    enableCodeInterpreter: boolean | null;
    enableFileUpload: boolean | null;

    // 模型参数
    temperature: number | null;          // 0-2
    topP: number | null;                 // 0-1
    frequencyPenalty: number | null;     // -2-2
    presencePenalty: number | null;      // -2-2

    // 响应配置
    responseFormat: "text" | "json" | "markdown" | null;
    streamResponse: boolean | null;

    // 安全配置
    contentFilter: "strict" | "moderate" | "loose" | null;

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
        | "frequencyPenalty"
        | "presencePenalty"
        | "responseFormat"
        | "streamResponse"
        | "contentFilter"
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

    declare contextLimit: number | null;
    declare maxTokens: number | null;
    declare thinkingMode: "fast" | "balanced" | "deep" | null;
    declare enableWebSearch: boolean | null;
    declare enableCodeInterpreter: boolean | null;
    declare enableFileUpload: boolean | null;
    declare temperature: number | null;
    declare topP: number | null;
    declare frequencyPenalty: number | null;
    declare presencePenalty: number | null;
    declare responseFormat: "text" | "json" | "markdown" | null;
    declare streamResponse: boolean | null;
    declare contentFilter: "strict" | "moderate" | "loose" | null;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    // 关联声明
    declare conversation?: NonAttribute<Conversation>;
    declare getConversation: BelongsToGetAssociationMixin<Conversation>;

    // ====== 实例方法 ======

    /**
     * 合并用户全局设置与该对话级设置，
     * 对话级有值的字段优先，null 则回退到用户级。
     * 需传入用户设置对象（UserConversationSetting）
     */
    getMergedSettings(userSettings: UserConversationSetting) {
        return {
            contextLimit: this.contextLimit ?? userSettings.contextLimit,
            maxTokens: this.maxTokens ?? userSettings.maxTokens,
            thinkingMode: this.thinkingMode ?? userSettings.thinkingMode,
            enableWebSearch: this.enableWebSearch ?? userSettings.enableWebSearch,
            enableCodeInterpreter:
                this.enableCodeInterpreter ?? userSettings.enableCodeInterpreter,
            enableFileUpload:
                this.enableFileUpload ?? userSettings.enableFileUpload,
            temperature: this.temperature ?? userSettings.temperature,
            topP: this.topP ?? userSettings.topP,
            frequencyPenalty:
                this.frequencyPenalty ?? userSettings.frequencyPenalty,
            presencePenalty:
                this.presencePenalty ?? userSettings.presencePenalty,
            responseFormat: this.responseFormat ?? userSettings.responseFormat,
            streamResponse: this.streamResponse ?? userSettings.streamResponse,
            contentFilter: this.contentFilter ?? userSettings.contentFilter,
        };
    }

    // ====== 静态方法 ======

    /**
     * 获取某个对话的设置（不存在则创建默认全继承）
     */
    static async getSettings(
        conversationId: string,
        modelSetting?: UserConversationSetting
    ): Promise<ConversationSetting> {
        let settings = await ConversationSetting.findOne({
            where: { conversationId },
        });

        if (!settings) {
            settings = await ConversationSetting.create({
                conversationId,
                // 全部 null，表示全部继承用户设置
                contextLimit: modelSetting?.contextLimit || 0,
                maxTokens: modelSetting?.maxTokens || null,
                thinkingMode: modelSetting?.thinkingMode || null,
                enableWebSearch: modelSetting?.enableWebSearch || null,
                enableCodeInterpreter: modelSetting?.enableCodeInterpreter || false,
                enableFileUpload: modelSetting?.enableFileUpload || false,
                temperature: modelSetting?.temperature || null,
                topP: modelSetting?.topP || null,
                frequencyPenalty: modelSetting?.frequencyPenalty || null,
                presencePenalty: modelSetting?.presencePenalty || null,
                responseFormat: modelSetting?.responseFormat || null,
                streamResponse: modelSetting?.streamResponse || null,
                contentFilter: modelSetting?.contentFilter || null,
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
        const settings = await ConversationSetting.getSettings(conversationId);
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
            contextLimit: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "context_limit",
                comment: "上下文窗口大小，null 使用用户级",
                validate: { min: 0, max: 100 },
            },
            maxTokens: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "max_tokens",
                comment: "单次回复最大 token，null 使用用户级",
                validate: { min: 256, max: 16384 },
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
            frequencyPenalty: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: true,
                field: "frequency_penalty",
                comment: "频率惩罚 -2-2，null 使用用户级",
                validate: { min: -2, max: 2 },
            },
            presencePenalty: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: true,
                field: "presence_penalty",
                comment: "存在惩罚 -2-2，null 使用用户级",
                validate: { min: -2, max: 2 },
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