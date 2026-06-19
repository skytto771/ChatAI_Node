# 星语 (StarTalk) — 后端服务

基于 Express 5 + Sequelize + MySQL 的 AI 聊天后端，对接 DeepSeek API 实现流式对话。

## 技术栈

| 类别     | 技术                               |
| -------- | ---------------------------------- |
| 框架     | Express 5.x                        |
| 语言     | TypeScript (target ES2022)         |
| 数据库   | MySQL (Sequelize ORM)              |
| 认证     | JWT (jsonwebtoken)                 |
| AI 接口  | DeepSeek API (OpenAI SDK + SSE 流) |
| 日志     | Winston + Morgan                   |
| 文件上传 | Multer                             |
| 定时任务 | node-schedule                      |

## 目录结构

```
node/
├── src/
│   ├── app.ts              # 应用入口，Express 配置与启动
│   ├── config/             # 数据库、JWT、上传、验证码等配置
│   ├── constants/          # HTTP 状态码/消息常量
│   ├── controller/         # 控制器层（请求处理）
│   ├── job/                # 定时任务（清理文件、验证码）
│   ├── middleware/          # 中间件（认证、错误处理、上传）
│   ├── models/             # Sequelize 数据模型
│   ├── router/             # 路由定义（按资源模块拆分）
│   ├── services/           # 业务逻辑层
│   ├── types/              # TypeScript 类型定义
│   ├── uploads/            # 上传文件存储
│   └── util/               # 工具（响应格式化、JWT、日志）
├── package.json
├── tsconfig.json
└── .env                    # 环境变量
```

## 快速开始

### 1. 配置环境变量

复制并编辑 `.env` 文件：

```env
PORT=3000
JWT_SECRET=your-jwt-secret
ADMIN_PASSWORD=your-admin-password
OPENAI_DEEPSEEK_API_KEY=sk-xxxxxxxx
DB_USERNAME=root
DB_PASSWORD=your-db-password
DB_DATABASE=chatwithai
DB_HOST=localhost
LOG_LEVEL=info
```

### 2. 安装依赖

```bash
cd node
npm install
```

### 3. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产构建
npm run build
npm start
```

默认运行在 `http://localhost:3000`。

## API 概览

所有接口以 `/api` 为前缀，参数通过 POST body 传递。

| 模块     | 路径前缀             | 主要端点                                           |
| -------- | -------------------- | -------------------------------------------------- |
| 用户     | `/api/user`          | `register` `login` `editUser` `forgotPassword`     |
| 文件上传 | `/api/upload`        | `uploadSmall` `largeFileInit` `chunk` `merge`      |
| 验证码   | `/api/verification`  | `sendCode`                                         |
| 会话     | `/api/conversation`  | `addConversation` `getConversationList` `delete`   |
| 消息     | `/api/message`       | `addMessage` `generateAiReply` `editAndRegenerate` |
| 模型设置 | `/api/modelSettings` | `getSettings` `updateSettings`                     |

### 统一响应格式

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {},
  "timestamp": 1718800000000,
  "requestId": "uuid"
}
```

## 架构分层

```
请求 → Router → authMiddleware → Controller → Service → Model (Sequelize)
```

- **Router** — 路由注册，绑定中间件
- **Controller** — 参数校验、调用 Service、返回响应
- **Service** — 核心业务逻辑，数据库操作封装
- **Model** — Sequelize 数据模型定义与关联

## 错误处理

新增代码统一抛出异常类（由 `errorHandlerMiddleware` 捕获）：

```typescript
throw new BadRequestException("参数错误");
throw new UnauthorizedException("未登录");
throw new NotFoundException("资源不存在");
```

## 注意事项

- `sequelize.sync({ alter: true })` 在开发环境自动修改表结构，生产环境有风险
- CORS 默认仅允许 `localhost:5173`，部署时需改为实际域名
- 上传文件静态服务依赖 `__dirname`，注意 `dist/` 目录结构
- TypeScript `target` 建议显式设置为 `ES2022`
