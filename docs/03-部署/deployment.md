# 部署方案 - 贪吃蛇（类 Immich 一键部署）

## 1. 部署模式

本项目采用 **Immich 风格**的部署方式：整个项目源码在一个 Git 仓库中，`docker-compose.yml` 在根目录，用户只需 `git clone` + `docker compose up` 即可部署。

```bash
git clone https://github.com/your-org/snake-game.git
cd snake-game
cp .env.example .env
docker compose up -d --build
```

## 2. 环境要求

| 组件 | 要求 | 说明 |
|------|------|------|
| NAS 型号 | Synology DS420+ 或同等 | Intel Celeron J4025 或更强 |
| DSM 版本 | DSM 7.x+ | 支持 Container Manager |
| CPU | 2 核 2.0 GHz+ | 空闲 CPU 约 30% |
| 内存 | 2 GB+（建议 6 GB+） | 本项目占用 ~1 GB |
| 磁盘 | 至少 5 GB 可用空间 | 包含镜像、数据、日志 |
| 网络 | 宽带端口 | 需公网 IP 或 DDNS |

## 3. 架构概览

```
外网访问
    │
    ├── HTTPS (443) ──> 群晖反向代理 ──> Nginx (80)
    │                                      │
    │                                      ├── /        → React 静态文件
    │                                      ├── /api/*   → Node.js REST API (3000)
    │                                      └── /ws      → WebSocket 推送 (3000)
    │
    └── HTTP (80)   ──> 群晖反向代理自动跳转 HTTPS

Docker 容器
    ├── nginx:alpine         → 静态文件 + 反向代理
    ├── node:20-alpine       → Express 后端
    └── postgres:15-alpine   → 数据库
```

## 4. 项目目录结构

```
snake-game/
├── docker-compose.yml          # 一键部署编排文件
├── nginx.conf                  # Nginx 配置（反向代理 + 静态文件）
├── .env.example                # 环境变量模板
├── .env                        # 本地环境变量（不提交）
├── .gitignore
├── .dockerignore
├── README.md
│
├── server/                     # 后端服务
│   ├── Dockerfile              # Node.js 多阶段构建
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── src/                    # 后端源码
│       ├── main.ts             # 入口（Express + WebSocket）
│       ├── routes/             # REST API 路由
│       ├── services/           # 业务逻辑
│       ├── middleware/          # 中间件（认证、限流）
│       └── db/                 # Prisma 配置
│
├── web/                        # 前端服务
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/                    # 前端源码
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/         # React 组件
│       ├── game/               # 游戏引擎（Canvas）
│       ├── pages/              # 页面
│       └── styles/             # 样式
│
├── database/                   # 数据库初始化脚本
│   └── init/
│       └── 01-init.sql         # 建表 + 视图 + 函数
│
├── docs/                       # 项目文档
│   ├── 01-PRD/
│   ├── 02-DRD/
│   ├── 03-部署/
│   ├── 04-开发任务/
│   └── 05-测试用例/
│
└── scripts/                    # 运维脚本
    ├── backup.sh               # 数据库备份
    └── migrate.sh              # 数据库迁移
```

## 5. 核心配置文件

### 5.1 docker-compose.yml

```yaml
version: '3.8'

services:
  # ==================== 数据库 ====================
  postgres:
    image: postgres:15-alpine
    container_name: snake-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-snake_game}
      POSTGRES_USER: ${POSTGRES_USER:-snake_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - snake_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    networks:
      - snake-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-snake_user} -d ${POSTGRES_DB:-snake_game}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 300M
          cpus: '0.5'

  # ==================== 后端 ====================
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: snake-server
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-snake_user}:${DB_PASSWORD}@postgres:5432/${POSTGRES_DB:-snake_game}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      RATE_LIMIT_WINDOW: ${RATE_LIMIT_WINDOW:-15}
      RATE_LIMIT_MAX: ${RATE_LIMIT_MAX:-100}
    volumes:
      - snake_logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - snake-net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 300M
          cpus: '1.0'

  # ==================== Nginx (静态文件 + 反向代理) ====================
  nginx:
    image: nginx:alpine
    container_name: snake-nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./web/dist:/usr/share/nginx/html:ro
      - snake_logs:/var/log/nginx
    depends_on:
      - server
    networks:
      - snake-net
    deploy:
      resources:
        limits:
          memory: 50M
          cpus: '0.3'

# ==================== 持久化卷 ====================
volumes:
  snake_data:   # PostgreSQL 数据
  snake_logs:   # 应用日志

# ==================== 网络 ====================
networks:
  snake-net:
    driver: bridge
```

### 5.2 .env.example

```bash
# ==================== 必需配置 ====================
# 数据库密码（必填，部署时修改）
DB_PASSWORD=

# JWT 密钥（必填，至少 64 位随机字符串）
JWT_SECRET=

# ==================== 可选配置 ====================
# 数据库名
POSTGRES_DB=snake_game

# 数据库用户
POSTGRES_USER=snake_user

# Token 有效期
JWT_EXPIRES_IN=7d

# API 限流
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Node 环境
NODE_ENV=production
```

### 5.3 server/Dockerfile

```dockerfile
# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .
RUN npm run build

# ==================== 运行阶段 ====================
FROM node:20-alpine

WORKDIR /app

# 安装 curl（健康检查用）
RUN apk add --no-cache curl

# 复制构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# 创建非 root 用户
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 5.4 nginx.conf

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        text/plain text/css text/xml text/javascript
        application/json application/javascript application/xml+rss
        image/svg+xml;

    server {
        listen 80;
        server_name _;

        # ==================== 静态资源 ====================
        root /usr/share/nginx/html;
        index index.html;

        # SPA 路由
        location / {
            try_files $uri $uri/ /index.html;

            # 静态资源缓存
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        # ==================== API 反向代理 ====================
        location /api/ {
            proxy_pass http://server:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # ==================== WebSocket ====================
        location /ws {
            proxy_pass http://server:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            # 长连接超时
            proxy_connect_timeout 7d;
            proxy_send_timeout 7d;
            proxy_read_timeout 7d;
        }
    }
}
```

### 5.5 .dockerignore

```
node_modules
dist
.git
.github
.vscode
.idea
*.md
!README.md
docs/
scripts/
.env
.env.*
!.env.example
```

### 5.6 .gitignore

```
node_modules/
dist/
.env
*.log
coverage/
.claude/
.DS_Store
```

## 6. 部署步骤

### 6.1 群晖 NAS 部署

```bash
# 1. SSH 登录群晖 NAS
ssh user@nas-ip

# 2. 克隆项目
mkdir -p /volume1/docker
cd /volume1/docker
git clone https://github.com/your-org/snake-game.git
cd snake-game

# 3. 构建前端（生成 dist 目录）
cd web && npm install && npm run build
cd ..

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 DB_PASSWORD 和 JWT_SECRET

# 5. 启动服务
docker compose up -d --build

# 6. 查看状态
docker compose ps

# 7. 查看日志
docker compose logs -f
```

### 6.2 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/your-org/snake-game.git
cd snake-game

# 2. 安装依赖
cd web && npm install
cd ../server && npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env

# 4. 启动开发服务器
# 终端 1: 启动后端
cd server && npm run dev

# 终端 2: 启动前端（开发模式会代理 API 到后端）
cd web && npm run dev
```

### 6.3 验证部署

```bash
# 健康检查
curl http://localhost:3000/api/health

# 注册测试
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# WebSocket 测试
wscat -c ws://localhost:3000/ws
```

## 7. 群晖反向代理配置

### 7.1 申请 SSL 证书

1. DSM → **控制面板** → **安全性** → **证书**
2. 点击 **新增** → 选择 **Let's Encrypt** → 填写域名 → 申请

### 7.2 配置反向代理

1. DSM → **控制面板** → **登录门户** → **高级** → **反向代理服务器**
2. 点击 **新增**

| 设置 | 值 |
|------|-----|
| 来源协议 | HTTPS |
| 来源主机 | your-domain.com |
| 来源端口 | 443 |
| 目标协议 | HTTP |
| 目标主机 | localhost |
| 目标端口 | 3000 |

3. **自定义标头** → 添加 WebSocket 支持：

| 标头 | 值 |
|------|-----|
| Upgrade | `$http_upgrade` |
| Connection | `upgrade` |
| Host | `$host` |
| X-Real-IP | `$remote_addr` |
| X-Forwarded-For | `$proxy_add_x_forwarded_for` |

### 7.3 HTTP 自动跳转 HTTPS

群晖 DSM 默认提供此功能：
DSM → **控制面板** → **登录门户** → 勾选 **自动将 HTTP 连接重定向到 HTTPS**

## 8. 日常运维

### 8.1 查看日志

```bash
docker compose logs -f          # 所有服务
docker compose logs -f server   # 仅后端
docker compose logs -f postgres # 仅数据库
```

### 8.2 更新服务

```bash
git pull                        # 拉取最新代码
cd web && npm install && npm run build  # 重新构建前端
cd ..
docker compose up -d --build    # 重新构建并启动
docker compose ps               # 确认状态
```

### 8.3 备份数据库

```bash
docker compose exec postgres pg_dump -U snake_user snake_game | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 8.4 数据库维护

```bash
# 连接数据库
docker compose exec postgres psql -U snake_user -d snake_game

# 刷新排行榜物化视图
SELECT refresh_leaderboard();

# 查看数据库大小
SELECT pg_size_pretty(pg_database_size('snake_game'));
```

### 8.5 监控资源

```bash
docker stats                    # 容器资源使用
du -sh /volume1/docker/snake-game  # 磁盘使用
```

## 9. 故障排查

### 9.1 服务无法启动

```bash
docker compose logs --tail=100  # 查看错误日志
docker compose ps               # 检查容器状态
cat .env                        # 确认环境变量已配置
```

### 9.2 数据库连接失败

```bash
docker compose ps postgres              # 检查 PostgreSQL 状态
docker compose exec postgres pg_isready # 测试连接
```

### 9.3 WebSocket 连接失败

```bash
docker compose logs -f server | grep -i websocket
wscat -c ws://localhost:3000/ws
```

### 9.4 重新初始化数据库

```bash
docker compose down -v          # 停止并删除数据卷（⚠️ 会丢失数据）
docker compose up -d --build    # 重新构建并启动
```

## 10. 安全加固

### 10.1 防火墙

DSM 防火墙中仅开放：
- 80 (HTTP → 自动跳转 HTTPS)
- 443 (HTTPS)

### 10.2 安全响应头

后端已集成 `helmet` 中间件，自动添加安全响应头。

### 10.3 环境变量安全

- `.env` 已加入 `.gitignore`，不会提交到仓库
- 提供 `.env.example` 作为模板，敏感字段留空
- 部署时必须修改 `DB_PASSWORD` 和 `JWT_SECRET`
