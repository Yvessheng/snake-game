export class ConflictError extends Error {
  statusCode = 409;
}

export class UnauthorizedError extends Error {
  statusCode = 401;
}

export class NotFoundError extends Error {
  statusCode = 404;
}

export class BadRequestError extends Error {
  statusCode = 400;
}

export class RateLimitError extends Error {
  statusCode = 429;
}
