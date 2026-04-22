import { Router, Response, NextFunction } from 'express';
import { getLeaderboard, getMyRank } from '../services/leaderboard.service';
import { AuthRequest, authenticate } from '../middleware/authenticate';

const router = Router();

// GET /api/leaderboard?limit=20&offset=0
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await getLeaderboard(limit, offset);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/leaderboard/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getMyRank(req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
