FROM node:20-alpine AS builder

WORKDIR /app

# 复制前端依赖和源码
COPY web/package*.json ./
RUN npm ci && npm cache clean --force

COPY web/ .
RUN npm run build

# ==================== Production image ====================
FROM nginx:alpine

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 删除默认配置
RUN rm -f /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

# 复制构建产物
COPY --from=builder /app/dist .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
