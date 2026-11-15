// Shared by Part 1 and Part 2.
// Errors always look like { "error": "short message" } (API contract, section 7).

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wrap async controllers so thrown errors reach errorHandler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFound(req, res) {
  res.status(404).json({ error: 'route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error('[error]', err);
  if (status >= 500) {
    // DEMO_MODE=true (local testing): add the real cause so the browser's Network tab and the
    // dashboard banner show it. Without it (production) only the short message is sent.
    const body = { error: 'server error' };
    if (process.env.DEMO_MODE === 'true') body.detail = err.message;
    return res.status(status).json(body);
  }
  res.status(status).json({ error: err.message });
}

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
