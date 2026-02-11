import type { Response } from 'express';

export function success(res: Response, data: unknown, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function created(res: Response, data: unknown) {
  return success(res, data, 201);
}

export function error(res: Response, message: string, statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function notFound(res: Response, resource = 'リソース') {
  return error(res, `${resource}が見つかりません`, 404);
}
