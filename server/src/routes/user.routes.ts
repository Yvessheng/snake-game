import { Router, Response, NextFunction } from 'express';
import { getUserById, getUserStats, updateUser } from '../services/user.service';
import { NotFoundError } from '../services/errors';
import { AuthRequest, authenticate } from '../middleware/authenticate';

const router = Router();

// GET /api/users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.userId!);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me
router.put('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { username, avatarUrl } = req.body;
    const user = await updateUser(req.userId!, { username, avatarUrl });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getUserStats(req.params.id as string);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
