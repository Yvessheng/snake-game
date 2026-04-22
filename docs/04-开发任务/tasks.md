# 开发任务清单

**项目名称**: 贪吃蛇（单机 + 排行榜）  
**版本**: v1.0  
**创建日期**: 2026-04-20  
**最后更新**: 2026-04-20  
**负责人**: 小龙虾

---

## 任务清单概览

| 优先级 | 总数 | 已完成 | 进行中 | 待处理 |
|--------|------|--------|--------|--------|
| P0     | 7    | 7      | 0      | 0      |
| P1     | 5    | 5      | 0      | 0      |
| P2     | 3    | 3      | 0      | 0      |
| **总计** | **15** | **15** | **0** | **0** |

**总预估工时**: 约 50 小时  
**已完成工时**: 约 60 小时  
**进度**: 100%

---

## 任务详情

### 模块一：项目基础搭建

#### T-001: 项目初始化与 Docker 配置

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 初始化前端项目（Vite + React 18 + TypeScript）
- 初始化后端项目（Node.js + Express + TypeScript）
- 配置 docker-compose.yml（Nginx + Node.js + PostgreSQL，类 Immich 风格根目录部署）
- 配置 nginx.conf（反向代理 + 静态文件 + WebSocket）
- 配置 .dockerignore 和 .gitignore
- 配置环境变量模板（.env.example）
- 初始化 Prisma ORM 和数据库连接
- 创建 database/init/ 初始化 SQL 脚本

**依赖关系**: 无

**测试验证方案**:
- [ ] `docker compose up` 启动成功，三个容器运行正常
- [ ] 访问 localhost:3000 显示前端页面（Nginx 代理）
- [ ] 后端 /api/health 返回 200
- [ ] 数据库连接成功

**修改文件**:
1. `web/` - 新建
2. `server/` - 新建
3. `docker-compose.yml` - 新建
4. `nginx.conf` - 新建
5. `.env.example` - 新建
6. `.dockerignore` - 新建
7. `.gitignore` - 新建
8. `database/init/` - 新建

---

#### T-002: 数据库模型设计与迁移

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 2h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 设计 User 表（id, username, email, password_hash, 统计字段）
- 设计 Score 表（id, user_id, score, snake_length, duration_ms, created_at）
- 设计 Achievement 表（id, user_id, achievement_key, unlocked_at）
- 编写 Prisma schema
- 执行数据库迁移

**依赖关系**: T-001

**测试验证方案**:
- [ ] `prisma migrate` 执行成功
- [ ] 所有表结构正确创建
- [ ] 唯一约束生效（username, email）
- [ ] 外键约束生效

**修改文件**:
1. `server/prisma/schema.prisma` - 新建
2. `server/prisma/migrations/` - 新建

---

### 模块二：用户系统

#### T-003: 用户注册与登录 API

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 4h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现 POST /api/auth/register 接口
- 实现 POST /api/auth/login 接口
- 密码使用 bcrypt 哈希（cost factor 12）
- 生成 JWT Token（有效期 24 小时）
- 输入验证（Zod schema）
- 速率限制（注册 3次/5分钟，登录 5次/分钟）
- 错误处理与统一响应格式

**依赖关系**: T-002

**API 端点**:
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

**测试验证方案**:
- [ ] 正常注册返回 JWT Token
- [ ] 重复用户名返回 409
- [ ] 重复邮箱返回 409
- [ ] 密码格式错误返回 400
- [ ] 正常登录返回 JWT Token
- [ ] 密码错误返回 401
- [ ] 速率限制触发返回 429

**修改文件**:
1. `server/src/controllers/auth.controller.ts` - 新建
2. `server/src/services/auth.service.ts` - 新建
3. `server/src/routes/auth.routes.ts` - 新建
4. `server/src/middleware/rateLimiter.ts` - 新建
5. `tests/auth.test.ts` - 新建

---

#### T-004: 用户认证中间件与 JWT 验证

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 2h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现 JWT 验证中间件
- 实现 WebSocket 握手认证（验证 Token）
- 统一错误响应格式

**依赖关系**: T-003

**测试验证方案**:
- [ ] 无 Token 访问受保护 API 返回 401
- [ ] 过期 Token 返回 401
- [ ] 有效 Token 正常通过
- [ ] WebSocket 握手带无效 Token 被拒绝

**修改文件**:
1. `server/src/middleware/auth.ts` - 新建

---

#### T-005: 用户资料与统计 API

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现 GET /api/users/me 接口
- 实现 PUT /api/users/me 接口（修改昵称等）
- 实现 GET /api/users/:id/stats 接口（查看用户统计）
- 用户名修改的唯一性检查

**依赖关系**: T-003

**API 端点**:
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户资料
- `GET /api/users/:id/stats` - 获取用户统计

**测试验证方案**:
- [ ] GET /me 返回当前用户信息
- [ ] PUT /me 更新成功
- [ ] 修改为已存在用户名返回 409

**修改文件**:
1. `server/src/controllers/user.controller.ts` - 新建
2. `server/src/routes/user.routes.ts` - 新建

---

### 模块三：游戏核心（前端）

#### T-006: 前端游戏引擎

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 6h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现游戏引擎核心类（GameEngine）
- 实现蛇的移动逻辑（方向、位置更新）
- 实现碰撞检测（墙壁、自身）
- 实现食物生成逻辑（随机位置、不与蛇重叠）
- 实现得分计算
- 实现游戏状态管理（idle、running、paused、gameover）
- 实现速度递增逻辑（每 50 分 -10ms，最低 50ms）
- 实现防反向操作（180 度掉头无效）

**核心类设计**:
```typescript
class GameEngine {
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setDirection(dir: Direction): void;
  tick(): void;          // 执行一个 tick
  getState(): GameState; // 获取当前状态
}

interface GameState {
  snake: SnakeState;
  foods: FoodState[];
  score: number;
  status: GameStatus;
  speed: number;
}
```

**依赖关系**: T-001（前端项目）

**测试验证方案**:
- [ ] 蛇按正确方向移动
- [ ] 蛇吃到食物后长度+1，得分+10
- [ ] 蛇撞墙后游戏结束
- [ ] 蛇撞自身后游戏结束
- [ ] 食物不在蛇身上生成
- [ ] 防反向操作生效
- [ ] 速度递增正确
- [ ] 暂停/继续正常

**修改文件**:
1. `frontend/src/services/gameEngine.ts` - 新建
2. `frontend/src/types/game.ts` - 新建
3. `frontend/src/utils/collision.ts` - 新建
4. `tests/gameEngine.test.ts` - 新建

---

#### T-007: 游戏页面与画布渲染

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 6h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现 GameCanvas 组件（Canvas 2D 渲染）
- 实现 GamePage 页面布局（画布 + 右侧面板）
- 实现键盘输入处理（方向键/WASD）
- 实现得分显示组件
- 实现暂停/继续功能
- 实现游戏结束检测与结算弹窗
- 实现重新开始功能
- 实现触屏滑动控制（移动端适配）

**依赖关系**: T-006

**测试验证方案**:
- [ ] 蛇可以正常移动和渲染
- [ ] 方向键/WASD 控制正常
- [ ] 防反向操作生效
- [ ] 吃到食物得分+10
- [ ] 撞墙/自身游戏结束
- [ ] 暂停/继续正常
- [ ] 重新开始正常
- [ ] 帧率 >= 30 FPS
- [ ] 结算弹窗正确显示

**修改文件**:
1. `frontend/src/pages/GamePage.tsx` - 新建
2. `frontend/src/components/game/GameCanvas.tsx` - 新建
3. `frontend/src/components/game/SnakeRenderer.ts` - 新建
4. `frontend/src/components/game/FoodRenderer.ts` - 新建
5. `frontend/src/components/ui/ScoreDisplay.tsx` - 新建
6. `frontend/src/hooks/useGameLoop.ts` - 新建
7. `frontend/src/hooks/useKeyboard.ts` - 新建

---

### 模块四：分数提交与排行榜 API

#### T-008: 分数提交 API

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现 POST /api/scores 接口
- 验证分数合法性（> 0）
- 防刷检查（每天最多 50 次）
- 游戏时长合理性校验（过短视为作弊）
- 插入 Score 记录
- 更新 User 最高分（如果更高）
- 更新 User 统计数据（总场次、总分数、总时长）
- 计算并返回当前排名

**依赖关系**: T-002, T-004

**API 端点**:
- `POST /api/scores` - 提交游戏分数

**测试验证方案**:
- [ ] 正常提交返回排名信息
- [ ] 分数 <= 0 返回 400
- [ ] 超过每日限制返回 429
- [ ] 游戏时长过短返回 400（作弊检测）
- [ ] 提交后用户最高分正确更新
- [ ] 提交后统计数据正确更新

**修改文件**:
1. `server/src/controllers/score.controller.ts` - 新建
2. `server/src/services/score.service.ts` - 新建
3. `server/src/routes/score.routes.ts` - 新建
4. `tests/score.test.ts` - 新建

---

#### T-009: 排行榜 API

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现 GET /api/leaderboard 接口（分页查询，按最高分排序）
- 实现 GET /api/leaderboard/me 接口（获取当前用户排名）
- 数据库索引优化（User.highest_score DESC）
- 支持分页（limit, offset）
- 查询性能优化（< 200ms）

**依赖关系**: T-002

**API 端点**:
- `GET /api/leaderboard?limit=20&offset=0` - 排行榜
- `GET /api/leaderboard/me` - 我的排名

**测试验证方案**:
- [ ] 排行榜按最高分降序排列
- [ ] 分页参数生效
- [ ] 我的排名返回正确位置
- [ ] 查询响应时间 < 200ms

**修改文件**:
1. `server/src/controllers/leaderboard.controller.ts` - 新建
2. `server/src/routes/leaderboard.routes.ts` - 新建

---

### 模块五：WebSocket 推送服务

#### T-010: WebSocket 推送服务

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 搭建 WebSocket 服务（Socket.io 或 ws）
- 实现握手时 JWT 认证
- 实现心跳保活机制（ping/pong）
- 实现排名变化事件发布
- 实现推送频率限制（同一用户 1 分钟内最多 3 次）
- 实现 Top 100 过滤（仅排名进入 Top 100 才推送）
- 实现连接数限制
- 在分数提交成功后触发推送

**事件定义**:
```
客户端 -> 服务器:
  - connect (带 token)
  - ping

服务器 -> 客户端:
  - rank_change { userId, username, oldRank?, newRank, score }
  - pong
  - error { code, message }
```

**依赖关系**: T-004, T-008

**测试验证方案**:
- [ ] WebSocket 连接认证成功
- [ ] 无效 Token 连接被拒绝
- [ ] 排名变化事件正确推送
- [ ] 推送频率限制生效
- [ ] 心跳保活正常
- [ ] Top 100 外排名变化不推送

**修改文件**:
1. `server/src/websocket/index.ts` - 新建
2. `server/src/websocket/push.ts` - 新建
3. `server/src/websocket/auth.ts` - 新建
4. `tests/websocket.test.ts` - 新建

---

#### T-011: 前端 WebSocket 与通知组件

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 封装 WebSocket 客户端连接
- 实现自动重连（指数退避）
- 实现 rank_change 事件监听
- 实现 NotificationPanel 组件
- 实现推送通知状态管理
- 实现免打扰模式
- 在首页和排行榜页集成通知面板

**依赖关系**: T-010, T-001（前端项目）

**测试验证方案**:
- [ ] WebSocket 连接成功
- [ ] 断线后自动重连
- [ ] 收到 rank_change 事件触发通知
- [ ] 通知面板正确显示
- [ ] 免打扰模式生效
- [ ] 点击通知跳转到排行榜

**修改文件**:
1. `frontend/src/services/websocket.ts` - 新建
2. `frontend/src/components/ui/NotificationPanel.tsx` - 新建
3. `frontend/src/hooks/useWebSocket.ts` - 新建

---

### 模块六：UI 页面与组件

#### T-012: 首页与登录/注册页面

| 项目 | 内容 |
|------|------|
| **优先级** | P0 |
| **预估工时** | 5h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现首页布局（Logo + 开始游戏 + 排行榜预览 + 统计卡片）
- 实现首页排行榜预览（Top 10）
- 实现登录页面
- 实现注册页面
- 实现表单验证（前端）
- 实现记住登录（localStorage）
- 实现顶部导航栏（Logo + 用户信息下拉）
- 实现路由配置

**依赖关系**: T-003

**测试验证方案**:
- [ ] 首页布局正确渲染
- [ ] 点击「开始游戏」进入游戏页
- [ ] 排行榜预览数据正确
- [ ] 登录表单验证正确
- [ ] 注册表单验证正确
- [ ] 登录成功后跳转首页
- [ ] 未登录用户统计卡片显示引导提示

**修改文件**:
1. `frontend/src/pages/HomePage.tsx` - 新建
2. `frontend/src/pages/LoginPage.tsx` - 新建
3. `frontend/src/pages/RegisterPage.tsx` - 新建
4. `frontend/src/components/layout/Header.tsx` - 新建
5. `frontend/src/App.tsx` - 新建

---

#### T-013: 排行榜页面

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现排行榜页面布局
- 实现排行榜表格组件
- 实现分页加载
- 实现排名高亮（前三名奖牌图标）
- 实现当前用户排名高亮
- 实现「我的排名」卡片
- 集成 WebSocket 实时更新（排名变化时高亮闪烁）

**依赖关系**: T-009, T-011

**测试验证方案**:
- [ ] 排行榜数据正确显示
- [ ] 前三名有奖牌标识
- [ ] 分页加载正常
- [ ] 当前用户行高亮显示
- [ ] WebSocket 推送触发排名更新动画
- [ ] 「我的排名」卡片正确显示

**修改文件**:
1. `frontend/src/pages/LeaderboardPage.tsx` - 新建
2. `frontend/src/components/ui/Leaderboard.tsx` - 新建

---

#### T-014: 个人资料页面

| 项目 | 内容 |
|------|------|
| **优先级** | P1 |
| **预估工时** | 3h |
| **任务状态** | 已完成 ✅ |
| **负责人** | 待分配 |

**任务描述**:
- 实现个人资料页面布局
- 实现用户统计卡片
- 实现成就列表展示
- 实现设置面板（皮肤、音效、推送、动画）
- 实现编辑资料功能
- 实现未登录重定向到登录页

**依赖关系**: T-005

**测试验证方案**:
- [ ] 个人资料正确显示
- [ ] 统计数据正确
- [ ] 成就列表正确展示
- [ ] 设置项保存成功
- [ ] 未登录自动跳转登录

**修改文件**:
1. `frontend/src/pages/ProfilePage.tsx` - 新建

---

### 模块七：增强功能（P2）

#### T-015: 皮肤系统

| 项目 | 内容 |
|------|------|
| **优先级** | P2 |
| **预估工时** | 4h |
| **任务状态** | 已完成 ✅ |
| **负责人** | Claude Agent |

**任务描述**:
- 设计 5 种蛇身皮肤（经典霓虹、像素、渐变、彩虹、火焰）
- 实现皮肤选择 UI（Profile 页面 + 游戏页切换）
- 实现皮肤数据存储在 User.best_skin
- 实现游戏画布中的皮肤渲染
- 实现皮肤解锁条件（P2 成就关联）

**依赖关系**: T-007

**测试验证方案**:
- [x] 皮肤选择生效
- [x] 游戏中皮肤正确渲染
- [x] 皮肤设置持久化

**修改文件**:
1. `frontend/src/components/game/SkinRenderer.ts` - 新建
2. `frontend/src/components/ui/SkinSelector.tsx` - 新建
3. `frontend/src/services/gameEngine.ts` - 更新

---

#### T-016: 成就系统

| 项目 | 内容 |
|------|------|
| **优先级** | P2 |
| **预估工时** | 4h |
| **任务状态** | 已完成 ✅ |
| **负责人** | Claude Agent |

**任务描述**:
- 定义成就列表（15 个成就）
- 实现成就解锁逻辑（分数提交后检查）
- 实现 Achievement 表写入
- 实现 GET /api/achievements 接口
- 实现成就展示组件
- 实现成就解锁通知

**成就列表**:
| Key | 名称 | 描述 | 条件 |
|-----|------|------|------|
| first_game | 首次游戏 | 完成第一次游戏 | 提交 1 次分数 |
| first_100 | 百分达人 | 单次得分达到 100 | score >= 100 |
| first_500 | 半千高手 | 单次得分达到 500 | score >= 500 |
| master_1000 | 千分大师 | 单次得分达到 1000 | score >= 1000 |
| legend_5000 | 传说玩家 | 单次得分达到 5000 | score >= 5000 |
| length_50 | 蛇长百尺 | 蛇长度达到 50 | length >= 50 |
| length_100 | 巨蛇传说 | 蛇长度达到 100 | length >= 100 |
| duration_5m | 持久战士 | 游戏时长超过 5 分钟 | duration >= 300000 |
| duration_10m | 耐力王者 | 游戏时长超过 10 分钟 | duration >= 600000 |
| games_10 | 初出茅庐 | 累计游戏 10 次 | total_games >= 10 |
| games_50 | 身经百战 | 累计游戏 50 次 | total_games >= 50 |
| games_100 | 百炼成钢 | 累计游戏 100 次 | total_games >= 100 |
| top_10 | 榜上有名 | 排名进入 Top 10 | rank <= 10 |
| top_3 | 三甲之列 | 排名进入 Top 3 | rank <= 3 |
| champion | 冠军宝座 | 排名达到 #1 | rank == 1 |

**依赖关系**: T-008

**测试验证方案**:
- [x] 达到条件后成就自动解锁
- [x] 成就列表正确显示
- [x] 已解锁/未解锁状态正确
- [x] 解锁通知正常弹出

**修改文件**:
1. `server/src/services/achievement.service.ts` - 新建
2. `server/src/controllers/achievement.controller.ts` - 新建
3. `server/src/routes/achievement.routes.ts` - 新建
4. `frontend/src/components/ui/AchievementBadge.tsx` - 新建

---

#### T-017: 音效与动画增强

| 项目 | 内容 |
|------|------|
| **优先级** | P2 |
| **预估工时** | 2h |
| **任务状态** | 已完成 ✅ |
| **负责人** | Claude Agent |

**任务描述**:
- 实现音效管理器（Web Audio API）
- 添加音效：吃食物、游戏结束
- 实现蛇死亡淡出效果
- 实现食物闪烁动画
- 实现得分数字滚动动画
- 实现音量控制和静音开关
- 实现「减少动画」选项

**依赖关系**: T-007

**测试验证方案**:
- [x] 吃食物时有音效
- [x] 游戏结束时有音效
- [x] 死亡淡出效果正常
- [x] 食物闪烁流畅
- [x] 静音开关正常
- [x] 减少动画选项生效

**修改文件**:
1. `frontend/src/services/audio.ts` - 新建
2. `frontend/src/components/game/SnakeRenderer.ts` - 更新
3. `frontend/src/components/game/FoodRenderer.ts` - 更新

---

## 版本历史

| 版本 | 日期 | 更新内容 | 更新人 |
|------|------|---------|--------|
| v1.0 | 2026-04-20 | 初始版本，包含 15 个任务（单机 + 排行榜） | 小龙虾 |

---

**文档结束**
