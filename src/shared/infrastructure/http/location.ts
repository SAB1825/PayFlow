import type { Request } from 'express';

/**
 * Builds an absolute-path `Location` header for a freshly created resource:
 * the request URL (prefix included, query string excluded) plus the new id,
 * e.g. `POST /api/v1/accounts` -> `/api/v1/accounts/<id>`.
 */
export function resourceLocation(req: Request, resourceId: string): string {
  const collectionUrl = req.originalUrl.split('?')[0].replace(/\/+$/, '');
  return `${collectionUrl}/${resourceId}`;
}
