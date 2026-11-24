import type { Request } from 'express';

export type AuthenticatedAuthRequest = Request & { user: { id: string } };
