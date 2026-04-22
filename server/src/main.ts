import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import scoreRoutes from './routes/score.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import achievementRoutes from './routes/achievement.routes';
import { errorMiddleware } from './middleware/error';
import { verifyToken } from './services/auth.service';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ==================== 中间件 ====================
app.use(helmet());
app.use(cors());
app.use(express.json());

// ==================== 路由 ====================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);

// ==================== 健康检查 ====================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    websocketClients: connectedClients.size,
  });
});

// ==================== 错误处理 ====================
app.use(errorMiddleware);

// ==================== HTTP 服务器 ====================
const httpServer = createServer(app);

// ==================== WebSocket 服务器 ====================
interface AuthWebSocket extends WebSocket {
  userId: string;
  isAlive: boolean;
}

interface ClientInfo {
  userId: string;
  ws: AuthWebSocket;
}

// 在线用户追踪：userId -> WebSocket
const connectedClients = new Map<string, ClientInfo>();

// 心跳保活
const HEARTBEAT_INTERVAL = 30_000;

const wss = new WebSocketServer({
  server: httpServer,
  path: '/ws',
  verifyClient: (info, cb) => {
    const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      return cb(false, 401, 'Authentication required');
    }

    const userId = verifyToken(token);
    if (!userId) {
      return cb(false, 401, 'Invalid or expired token');
    }

    // 将 userId 附加到 request 对象
    (info.req as any).userId = userId;
    cb(true);
  },
});

wss.on('connection', (ws: AuthWebSocket, req: IncomingMessage) => {
  const userId = (req as any).userId as string;
  ws.isAlive = true;

  // 同用户踢掉旧连接
  if (connectedClients.has(userId)) {
    const oldWs = connectedClients.get(userId)!.ws;
    oldWs.terminate();
  }

  connectedClients.set(userId, { userId, ws });

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => {
    connectedClients.delete(userId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    connectedClients.delete(userId);
  });
});

// 心跳定时器
const heartbeat = setInterval(() => {
  for (const [userId, { ws }] of connectedClients) {
    if (!ws.isAlive) {
      ws.terminate();
      connectedClients.delete(userId);
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeat);
});

// ==================== 广播排名变化 ====================

// 推送频率限制: userId -> timestamps (last 60s)
const pushHistory = new Map<string, number[]>();
const MAX_PUSH_PER_MINUTE = 3;
const TOP_100_THRESHOLD = 100;
const PUSH_WINDOW_MS = 60_000;

export function broadcastRankChange(data: { userId: string; username?: string; score: number; newRank: number }) {
  // Top100 过滤
  if (data.newRank > TOP_100_THRESHOLD) return;

  // 推送频率限制
  const now = Date.now();
  const timestamps = pushHistory.get(data.userId) ?? [];
  const recent = timestamps.filter((t) => now - t < PUSH_WINDOW_MS);

  if (recent.length >= MAX_PUSH_PER_MINUTE) {
    pushHistory.set(data.userId, recent);
    return; // 频率限制
  }
  recent.push(now);
  pushHistory.set(data.userId, recent);

  const message = JSON.stringify({
    event: 'rank_change',
    data,
  });

  for (const [, { ws }] of connectedClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

// ==================== 启动 ====================
httpServer.listen(PORT, () => {
  console.log(`🐍 Snake Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
});
