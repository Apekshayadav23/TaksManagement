import { User } from '../models/index.js';
import { verifyToken } from '../utils/auth.js';
import { unauthorized } from '../utils/httpError.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) throw unauthorized('Missing authorization token');

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user) throw unauthorized('Invalid token');

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(unauthorized(error.message || 'Unauthorized'));
  }
}
