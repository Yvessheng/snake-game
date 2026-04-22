# 项目配置 - 贪吃蛇（单机 + 排行榜）

## 基本信息
- **项目类型**: 新建项目
- **当前阶段**: 需求文档已重写，待确认
- **创建日期**: 2026-04-20
- **最后更新**: 2026-04-21
- **项目描述**: 单机贪吃蛇 + 在线排行榜系统，游戏完全在前端运行，后端仅提供认证、排行榜和排名推送服务

## 核心定位
- **游戏是单机的，排行榜是联网的**
- 游戏运行不需要网络连接
- WebSocket 仅用于排行榜排名变更推送

## 当前任务
- **已完成**: 全部 15 个任务（P0 + P1 + P2）

## 已完成模块
1. 项目初始化与 Docker 配置
2. 数据库模型设计与迁移
3. 用户注册与登录 API
4. 用户认证中间件与 JWT 验证
5. 用户资料与统计 API
6. 前端游戏引擎
7. 游戏页面与画布渲染
8. 分数提交 API
9. 排行榜 API
10. WebSocket 推送服务
11. 前端 WebSocket 与通知组件
12. 首页与登录/注册页面
13. 排行榜页面
14. 个人资料页面
15. 皮肤系统
16. 成就系统
17. 音效与动画增强

## 技术栈
React 18 + TypeScript + Node.js 20 + PostgreSQL 15 + WebSocket (ws) + Nginx

## 部署架构
类 Immich 一键部署：`git clone` → `docker compose up -d --build`
群晖反向代理 (HTTPS) → Nginx (静态文件 + 反向代理) → Node.js (API + WebSocket) + PostgreSQL

## 项目目录
```
snake-game/
├── docker-compose.yml   # 根目录，一键部署
├── nginx.conf           # Nginx 配置
├── server/              # 后端
├── web/                 # 前端源码
├── database/init/       # 数据库初始化
├── docs/                # 项目文档
└── scripts/             # 运维脚本
```

## 项目文档 (本目录下)
| 文档 | 路径 | 版本 | 状态 |
|------|------|------|------|
| PRD | ./docs/01-PRD/PRD-v1.0.md | v1.0 | 待确认 |
| DRD | ./docs/02-DRD/DRD-v1.0.md | v1.0 | 待确认 |
| Tasks | ./docs/04-开发任务/tasks.md | v1.0 | 待确认 |
| Test Cases | ./docs/05-测试用例/test-cases.md | v1.0 | 待确认 |

## 任务状态
| 优先级 | 总数 | 已完成 | 进行中 | 待处理 |
|--------|------|--------|--------|--------|
| P0     | 7    | 7      | 0      | 0      |
| P1     | 5    | 5      | 0      | 0      |
| P2     | 3    | 3      | 0      | 0      |

## 技术决策
| 决策 | 日期 | 说明 |
|------|------|------|
| 技术栈确定 | 2026-04-20 | React 18 + TypeScript + Node.js 20 + PostgreSQL 15 |
| 游戏架构 | 2026-04-20 | 游戏完全在前端运行（Canvas），无需服务器同步 |
| 实时通信 | 2026-04-20 | WebSocket 仅用于排行榜排名变更推送，不用于游戏同步 |
| 部署方案 | 2026-04-21 | 群晖 NAS Docker Compose，Nginx + Node.js + PostgreSQL 三容器，docker-compose.yml 在根目录 |

## 开发规范
- 使用 TypeScript
- 遵循 ESLint 配置
- 单元测试覆盖率 > 80%
- 提交规范：feat/fix/docs/style/refactor/perf/test/chore

## 常见问题
### Q1: 如何启动开发环境？
**答**:
```bash
docker compose up
```

## 重要提醒
- 提交前必须运行测试
- 数据库迁移需要备份
- API 变更需要更新文档
- JWT_SECRET 和 DB_PASSWORD 必须使用环境变量

## 版本历史
| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v1.0 | 2026-04-20 | 初始版本 |
| v1.1 | 2026-04-20 | 重写四份文档：PRD/DRD/Tasks/Test Cases（单机 + 排行榜版） |
| v1.3 | 2026-04-21 | 类 Immich 结构：docker-compose.yml 在根目录，Nginx + Node.js + PostgreSQL 三容器部署 |
| v1.4 | 2026-04-21 | 全部 15 个任务完成：P0/P1 核心功能 + P2 皮肤/成就/音效 |
