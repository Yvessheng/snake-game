FROM node:20-alpine

WORKDIR /app

# 安装 curl（健康检查用）
RUN apk add --no-cache curl

# 复制依赖和源码
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖 + 生成 Prisma client
RUN npm ci --only=production && \
    npm install --no-save prisma && \
    npx prisma generate && \
    npm cache clean --force

COPY . .
RUN npm run build

# 创建非 root 用户
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
