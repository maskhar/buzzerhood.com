import type { FastifyRequest } from 'fastify';

export type AuthenticatedUser = { id: string; email: string };
export type AuthenticatedRequest = FastifyRequest & { authUser: AuthenticatedUser };
export type AuthResult = { accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string; csrfToken: string };
