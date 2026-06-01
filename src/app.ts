import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { initDB, User } from './models';
import router from './router';

const app: Express = express();

app.use(express.urlencoded());
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
}));
app.use(morgan('dev'))
// 处理静态文件访问
app.use('/images', express.static(path.join(__dirname, 'uploads/files/images')));
app.use('/videos', express.static(path.join(__dirname, 'uploads/files/videos')));
app.use('/others', express.static(path.join(__dirname, 'uploads/files/others')));

// 路由
app.use('/api', router);

// 中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method},  ${req.url},  ${Date.now()}`);
  next();
});

// 状态处理中间件
app.use((req: Request, res: Response, next: NextFunction)=>{
    res.status(404).json('404 NOT FOUND')
})

// 错误处理中间件
app.use((err: Error,req: Request, res: Response, next: NextFunction)=>{
    res.status(500).json('server ERROR')
})

// 启动服务器
const startServer = async () => {
    try {
        // 初始化数据库（自动建表）
        await initDB();
        
        // 插入测试数据
        const adminUsername = 'chatAdmin';
        const existingAdmin = await User.findOne({
            where: { username: adminUsername }
        });
        
        if (!existingAdmin) {
            await User.create({
                username: adminUsername,
                password: 'Admin@123456',   // 建议使用强密码，后续可通过环境变量配置
                email: 'admin@example.com',
                phone: '13800000000',
                nickname: '系统管理员',
                bio: '超级管理员账号',
                role: 'admin',              // 关键：赋予 admin 角色
                status: 'active',
                lastLoginAt: null,
            });
            console.log('✅ 测试数据插入成功');
        }
        
        // 启动服务器
        app.listen(3000, () => {
            console.log('🚀 服务器运行在 http://localhost:3000');
        });
        
    } catch (error) {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    }
};

startServer();