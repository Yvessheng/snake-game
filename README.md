# 🐍 贪吃蛇（单机 + 排行榜）

单机贪吃蛇游戏 + 在线排行榜系统。游戏完全在前端浏览器中运行（Canvas），后端仅提供用户认证、排行榜、成就系统和排名推送服务。

## ✨ 功能特性

- 🎮 **经典贪吃蛇** — Canvas 渲染，霓虹风格，5 种皮肤可选
- 🏆 **在线排行榜** — 提交分数、实时排名、WebSocket 推送排名变更
- 🏅 **成就系统** — 15 个成就，自动解锁，进度追踪
- 🔔 **实时通知** — 排名变更即时推送
- 🔊 **音效系统** — Web Audio API 音效，音量可调
- 🎨 **皮肤系统** — 经典霓虹、赛博霓虹、像素、渐变紫、火焰

## 🚀 一键部署

### 前置要求

- Docker & Docker Compose v2
- Linux / macOS / Windows（WSL2）
- 内存 ≥ 1GB

### 部署步骤

#### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/snake-game.git
cd snake-game
```

#### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，修改以下两项：

```env
DB_PASSWORD=your-secure-db-password          # 数据库密码
JWT_SECRET=your-random-64-char-secret-key    # JWT 密钥（至少 64 位）
```

#### 3. 启动服务

```bash
docker compose up -d --build
```

#### 4. 访问应用

浏览器打开：`http://localhost:3000`

### 群晖 NAS 部署

1. 在群晖 Container Manager 中安装 Docker
2. SSH 登录群晖
3. 克隆项目并配置 `.env`
4. 运行 `docker compose up -d --build`
5. 在群晖控制面板 → 登录门户 → 反向代理服务器中配置 HTTPS

## 🏗 架构

```
┌──────────────────────────────────────────────┐
│  Nginx (Web 容器)                             │
│  ├─ 静态文件 (React SPA)                      │
│  ├─ 反向代理 /api/* → Server                  │
│  └─ WebSocket 代理 /ws → Server               │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│  Node.js (Server 容器)                        │
│  ├─ Express 5 API                            │
│  ├─ WebSocket (ws)                           │
│  └─ Prisma ORM                                │
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│  PostgreSQL 15 (数据库)                       │
└──────────────────────────────────────────────┘
```

## 📁 项目结构

```
snake-game/
├── docker-compose.yml     # 一键部署配置
├── .env.example           # 环境变量模板
├── .gitignore
├── web/                   # 前端 (React 18 + TypeScript + Vite)
│   ├── Dockerfile
│   ├── src/
│   │   ├── services/      # 游戏引擎、API、音效
│   │   ├── components/    # Canvas、UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── utils/         # 工具函数
│   │   └── types/         # 类型定义
│   └── tests/
├── server/                # 后端 (Node.js + Express + Prisma)
│   ├── Dockerfile
│   ├── prisma/            # 数据库 Schema
│   └── src/
│       ├── services/      # 业务逻辑
│       ├── routes/        # API 路由
│       ├── middleware/    # 中间件
│       └── types/         # 类型定义
└── database/init/         # 数据库初始化脚本
```

## 🛠 本地开发

### 前端

```bash
cd web
npm install
npm run dev              # 开发服务器 (localhost:5173)
npm test                 # 运行测试
npm run build            # 生产构建
```

### 后端

```bash
cd server
npm install
cp .env.example .env     # 配置环境变量
npm run dev              # 开发服务器 (localhost:3000)
```

## 📊 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Canvas 2D |
| 后端 | Node.js 20 + Express 5 + TypeScript |
| 数据库 | PostgreSQL 15 + Prisma ORM |
| 实时通信 | WebSocket (ws) |
| 部署 | Docker Compose + Nginx |

## 📝 License

MIT
