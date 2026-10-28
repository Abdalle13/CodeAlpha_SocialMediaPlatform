export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      status: 404,
    },
  });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Log error cleanly server-side without leaking raw secrets or stack traces
  console.error(`[Server Error ${status}]:`, err.message);

  res.status(status).json({
    error: {
      message: isProd && status === 500 ? 'An unexpected error occurred.' : err.message,
      status,
      ...(isProd ? {} : { stack: err.stack }),
    },
  });
}

