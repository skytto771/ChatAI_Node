// config/jwt.js
interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  algorithm: string;
}

const secret = process.env.JWT_SECRET;

// 启动时强制校验，防止空字符串签名导致安全漏洞
if (!secret) {
  console.error("❌ 致命错误：未配置 JWT_SECRET 环境变量！");
  console.error("   请在 .env 文件中设置 JWT_SECRET=<your-secret-key>");
  process.exit(1);
}

export default {
  // JWT 密钥（生产环境必须使用强随机字符串）
  secret,

  // Token 过期时间
  expiresIn: "7d", // 7天

  // Refresh Token 过期时间
  refreshExpiresIn: "30d",

  // 算法
  algorithm: "HS256",

  // // 签发者
  // issuer: 'your-app-name',

  // // 受众
  // audience: 'your-app-client'
} as JWTConfig;
