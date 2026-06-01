// config/database.ts
import { Dialect } from "sequelize";

interface databaseConfig {
  development: {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: Dialect;
    logging: boolean | ((sql: string) => void);
    define: {
      timestamps: boolean;
      underscored: boolean;
      charset: string;
      collate: string;
    };
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
    }
  };
}

export default {
  development:{
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "chatwithai",
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: /* console.log */ false, // 设为 false 可关闭 SQL 日志
    define: {
      timestamps: true, // 自动添加 createdAt 和 updatedAt
      underscored: true, // 使用下划线命名
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
} as databaseConfig;
