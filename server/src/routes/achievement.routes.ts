import { Router } from 'express';
import { getUserAchievements } from '../services/achievement.service';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res) => {
  const achievements = await getUserAchievements(req.userId!);
  res.json({ achievements });
});

export default router;
