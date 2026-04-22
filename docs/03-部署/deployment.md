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
│   ├── Dockerfile              # Node.js 构建（含 Prisma generate）
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma       # 数据库模型
│   └── src/                    # 后端源码
│       ├── main.ts             # 入口（Express + WebSocket）
│       ├── routes/             # REST API 路由
│       ├── services/           # 业务逻辑
│       ├── middleware/          # 中间件（认证、错误处理）
│       ├── types/              # 类型定义与校验
│       └── db/                 # Prisma 配置
│
├── web/                        # 前端服务
│   ├── Dockerfile              # 多阶段构建（Vite build → Nginx）
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── src/                    # 前端源码
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/         # React 组件
│       ├── pages/              # 页面
│       ├── services/           # 游戏引擎、API、音效
│       ├── hooks/              # 自定义 Hooks
│       └── types/              # 类型定义
│
└── database/                   # 数据库初始化脚本
    └── init/
        └── 01-init.sql         # 建表 + 视图 + 函数
```

## 5. 核心配置文件

### 5.1 docker-compose.yml

```yaml
services:
  # ==================== 前端 (Nginx 静态文件 + 反向代理) ====================
  web:
    build:
      context: .
      dockerfile: web/Dockerfile
    container_name: snake-web
    ports:
      - "3000:80"
    depends_on:
      - server
    networks:
      - snake-net
    restart: unless-stopped

  # ==================== 后端 ====================
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: snake-server
    env_file:
      - .env
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-snake_user}:${DB_PASSWORD}@postgres:5432/${POSTGRES_DB:-snake_game}?schema=public
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - snake-net
    restart: unless-stopped

  # ==================== 数据库 ====================
  postgres:
    image: postgres:15-alpine
    container_name: snake-postgres
    env_file:
      - .env
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-snake_game}
      POSTGRES_USER: ${POSTGRES_USER:-snake_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - snake_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
    networks:
      - snake-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-snake_user} -d ${POSTGRES_DB:-snake_game}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  snake_data:

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
```

### 5.3 server/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npm install --no-save prisma && \
    npx prisma generate && \
    npm cache clean --force

COPY . .
RUN npm run build

RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser && \
    chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 5.4 web/Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY web/package*.json ./
RUN npm ci && npm cache clean --force

COPY web/ .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 5.5 nginx.conf

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

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;

            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }

        location /api/ {
            proxy_pass http://server:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /ws {
            proxy_pass http://server:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_connect_timeout 7d;
            proxy_send_timeout 7d;
            proxy_read_timeout 7d;
        }
    }
}
```

### 5.6 .dockerignore

```
node_modules/
dist/
.env
.env.*
!.env.example
.git/
.github/
.vscode/
.idea/
.DS_Store
Thumbs.db
docs/
*.md
!README.md
scripts/
server/
database/
*.log
.claude/
```

### 5.7 .gitignore

```
node_modules/
dist/
build/
.env
.env.local
.env.*.local
.vscode/
.idea/
.DS_Store
Thumbs.db
*.log
coverage/
postgres/data/
logs/
.claude/
```

## 6. 部署步骤

### 6.1 群晖 NAS 部署

```bash
# 1. SSH 登录群晖 NAS
ssh user@nas-ip

# 2. 克隆项目并进入目录
mkdir -p /volume1/docker
cd /volume1/docker
git clone https://github.com/Yvessheng/snake-game.git
cd snake-game

# 3. 配置环境变量
cp .env.example .env
vi .env   # 编辑 .env，填写 DB_PASSWORD 和 JWT_SECRET

# 4. 构建并启动（首次需下载镜像和构建，约 3-5 分钟）
docker compose up -d --build

# 5. 查看状态
docker compose ps

# 6. 查看日志
docker compose logs -f
```

访问 `http://群晖IP:3000` 即可使用。

### 6.2 本地开发

适用于修改代码、调试功能的开发者。

```bash
# 1. 克隆项目
git clone https://github.com/Yvessheng/snake-game.git
cd snake-game

# 2. 安装依赖
cd web && npm install && cd ..
cd server && npm install && cd ..

# 3. 配置环境变量
cp .env.example server/.env

# 4. 终端 1: 启动后端开发服务器（localhost:3000，支持热更新）
cd server && npm run dev

# 5. 终端 2: 启动前端开发服务器（localhost:5173，API 自动代理到后端）
cd web && npm run dev
```

前端访问 `http://localhost:5173`，后端 API 代理到 `http://localhost:3000`。

### 6.3 验证部署

```bash
# 健康检查
curl http://localhost:3000/api/health

# 注册测试
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'
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

DSM → **控制面板** → **登录门户** → 勾选 **自动将 HTTP 连接重定向到 HTTPS**

## 8. 日常运维

### 8.1 查看日志

```bash
docker compose logs -f          # 所有服务
docker compose logs -f server   # 仅后端
docker compose logs -f postgres # 仅数据库
docker compose logs -f web      # 仅前端
```

### 8.2 更新服务

```bash
cd /volume1/docker/snake-game   # 进入项目目录
git pull                        # 拉取最新代码
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

# 查看数据库大小
SELECT pg_size_pretty(pg_database_size('snake_game'));

# 退出
\q
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

### 9.3 前端无法访问

```bash
docker compose ps web                   # 检查 Nginx 状态
docker compose logs web                 # 查看 Nginx 日志
docker compose exec web curl -I http://localhost  # 测试本地访问
```

### 9.4 WebSocket 连接失败

```bash
docker compose logs -f server | grep -i websocket
```

### 9.5 重新初始化数据库

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
