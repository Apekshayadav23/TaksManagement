import { forbidden } from '../utils/httpError.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
