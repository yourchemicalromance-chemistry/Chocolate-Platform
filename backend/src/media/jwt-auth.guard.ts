import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from './authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication is required.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: unknown; ver?: unknown }>(token, {
        algorithms: ['HS256'],
      });
      if (typeof payload.sub !== 'string' || !isUuid(payload.sub)) {
        throw new Error('Invalid subject');
      }
      const tokenVersion = payload.ver === undefined ? 0 : payload.ver;
      if (!Number.isInteger(tokenVersion) || (tokenVersion as number) < 0) throw new Error('Invalid token version');
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { tokenVersion: true, accountStatus: true },
      });
      if (!user || user.accountStatus === 'PENDING_DELETION' || user.tokenVersion !== tokenVersion) {
        throw new Error('Invalid token version');
      }
      request.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException('Authentication is required.');
    }
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
