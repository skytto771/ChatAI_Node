// models/index.ts
import config from '../config/database'
import { Sequelize, Model, DataTypes } from 'sequelize';
import initFile from './File';
import initUser from './User'; // 假设也是类似结构
import initUserAvatar from './UserAvatar';
import initFileChunk from './FileChunk';
import initUserQuota from './UserQuota';
import initConversation from './Conversation';
import initMessage from './Message';
import initMessageFile from './MessageFile';
import initVerificationCode from './VerificationCode';
import initUserConversationSetting from './UserConversationSetting'
import initConversationSetting from './ConversationSetting'


// 创建 Sequelize 实例
const sequelize = new Sequelize(
    config.development.database,
    config.development.username,
    config.development.password,
    {
        host: config.development.host,
        dialect: config.development.dialect,
        logging: config.development.logging,
        define: config.development.define,
        pool: config.development.pool
    }
);

// 导入模型
const User = initUser(sequelize);
const File = initFile(sequelize);
const UserAvatar = initUserAvatar(sequelize);
const FileChunk = initFileChunk(sequelize);
const UserQuota = initUserQuota(sequelize);
const Conversation = initConversation(sequelize);
const Message = initMessage(sequelize);
const MessageFile = initMessageFile(sequelize);
const VerificationCode = initVerificationCode(sequelize);
const UserConversationSetting = initUserConversationSetting(sequelize)
const ConversationSetting = initConversationSetting(sequelize)

// 建立关联（在使用前调用）
const models = {
    User,
    File,
    FileChunk,
    UserAvatar,
    UserQuota,
    Conversation,
    Message,
    MessageFile,
    VerificationCode,
    UserConversationSetting,
    ConversationSetting,
};

// 执行所有模型的 associate
Object.values(models).forEach((model: any) => {
    if (model.associate) {
        model.associate(models);
    }
});
// 同步数据库（自动建表）
const initDB = async () => {
    try {
        // 测试连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        
        // 同步所有模型
        // { alter: true } - 自动更新表结构（生产环境慎用）
        // { force: false } - 如果表不存在则创建
        await sequelize.sync({ alter: true, force: false });
        console.log('✅ 所有模型同步完成');
        
        return true;
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        throw error;
    }
};

export {
    sequelize,
    User,
    File,
    UserAvatar,
    FileChunk,
    VerificationCode,
    Conversation,
    Message,
    MessageFile,
    UserConversationSetting,
    ConversationSetting,
    initDB,
};