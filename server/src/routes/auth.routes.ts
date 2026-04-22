import { Router, Request, Response, NextFunction } from 'express';
import { register, login } from '../services/user.service';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
