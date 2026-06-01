import winston from 'winston';
import morgan from 'morgan';

// 配置 Winston
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json() // 生产环境用 JSON
    ),
    transports: [
        // 控制台输出（开发环境）
        new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.simple()
        ),
        }),
        // 文件输出
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.json()
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880,
            maxFiles: 5,
            format: winston.format.json()
        }),
    ],
});

// 创建 Morgan 使用的流（将 Morgan 日志输出到 Winston）
export const morganStream = {
    write: (message: string) => {
        // Morgan 默认会带换行符，去掉它
        logger.info(message.trim());
    },
};

// 自定义 Morgan token（可选）
morgan.token('custom-date', () => {
    return new Date().toISOString();
});

export default logger;