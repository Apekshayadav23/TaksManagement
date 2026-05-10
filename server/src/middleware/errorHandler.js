import { ValidationError } from 'sequelize';

export function notFoundHandler(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res) {
  if (err instanceof ValidationError) {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ message: messages[0] || 'Validation failed', details: messages });
  }

  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message;

  return res.status(status).json({ message });
}
