import { Router, Response, NextFunction } from 'express';
import { submitScore } from '../services/score.service';
import { scoreSchema } from '../types/score.schema';
import { AuthRequest, authenticate } from '../middleware/authenticate';
import { broadcastRankChange } from '../main';

const router = Router();

// POST /api/scores
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = scoreSchema.parse(req.body);
    const result = await submitScore(req.userId!, validated);

    // Broadcast rank change if user made top 100
    broadcastRankChange({
      userId: req.userId!,
      score: validated.score,
      newRank: result.rank,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
