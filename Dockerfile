# ============================================
# 星语 (StarTalk) 后端 Dockerfile
# ============================================
FROM node:alpine AS builder

WORKDIR /app

# 安装全部依赖（含 devDependencies 用于 tsc 编译）
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# 复制源码及 tsconfig
COPY tsconfig.json ./
COPY src/ ./src/

# TypeScript 编译
RUN npx tsc

# ============================================
# 生产运行阶段
# ============================================
FROM node:alpine

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 从 builder 复制 node_modules（仅生产依赖需要重新安装以减小体积）
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# 复制编译产物
COPY --from=builder /app/dist ./dist

# 复制静态资源（HTML 等）
COPY --from=builder /app/src/assets ./dist/assets

# 创建运行时目录
RUN mkdir -p dist/uploads/files/images \
             dist/uploads/files/videos \
             dist/uploads/files/others \
             dist/uploads/temp \
             logs && \
    chown -R nodejs:nodejs dist/uploads logs

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/app.js"]
