// config/jwt.js
interface JWTConfig {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm: string;
}


export default {
    // JWT 密钥（生产环境应该使用环境变量）
    secret: process.env.JWT_SECRET || '',
    
    // Token 过期时间
    expiresIn: '12h',  // 7天
    
    // Refresh Token 过期时间
    refreshExpiresIn: '30d',
    
    // 算法
    algorithm: 'HS256',
    
    // // 签发者
    // issuer: 'your-app-name',
    
    // // 受众
    // audience: 'your-app-client'
} as JWTConfig;