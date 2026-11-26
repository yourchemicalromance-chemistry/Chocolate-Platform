import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EmailOtpDelivery } from '../auth/otp-delivery.js';
import { PrismaService } from '../prisma/prisma.service.js';

const LEASE_MS = 60_000;
const BATCH_SIZE = 20;

@Injectable()
export class VerificationNotificationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VerificationNotificationWorker.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly prisma: PrismaService, private readonly email: EmailOtpDelivery) {}

  onModuleInit(): void {
    void this.drain();
    this.timer = setInterval(() => void this.drain(), 15_000);
    this.timer.unref();
  }

  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async drain(now = new Date()): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let sent = 0;
    try {
      const due = await this.prisma.verificationNotification.findMany({
        where: { OR: [
          { status: 'PENDING', nextAttemptAt: { lte: now } },
          { status: 'PROCESSING', leaseExpiresAt: { lte: now } },
        ] }, orderBy: { nextAttemptAt: 'asc' }, take: BATCH_SIZE,
        select: { id: true },
      });
      for (const item of due) {
        const claimed = await this.prisma.verificationNotification.updateMany({
          where: { id: item.id, OR: [
            { status: 'PENDING', nextAttemptAt: { lte: now } },
            { status: 'PROCESSING', leaseExpiresAt: { lte: now } },
          ] },
          data: { status: 'PROCESSING', attempts: { increment: 1 }, leaseExpiresAt: new Date(now.getTime() + LEASE_MS) },
        });
        if (claimed.count !== 1) continue;
        const task = await this.prisma.verificationNotification.findUnique({
          where: { id: item.id },
          select: { id: true, attempts: true, verification: { select: { status: true, owner: { select: { email: true } } } } },
        });
        if (!task) continue;
        try {
          await this.email.sendVerificationDecision(task.verification.owner.email, task.verification.status === 'VERIFIED');
          await this.prisma.verificationNotification.updateMany({
            where: { id: item.id, status: 'PROCESSING' },
            data: { status: 'SENT', sentAt: new Date(), leaseExpiresAt: null, lastErrorCode: null },
          });
          sent += 1;
        } catch {
          const delay = Math.min(60 * 60_000, 5_000 * 2 ** Math.min(task.attempts - 1, 9));
          await this.prisma.verificationNotification.updateMany({
            where: { id: item.id, status: 'PROCESSING' },
            data: { status: 'PENDING', nextAttemptAt: new Date(now.getTime() + delay), leaseExpiresAt: null, lastErrorCode: 'SMTP_DELIVERY_FAILED' },
          });
          this.logger.warn('Verification decision email failed; delivery will retry.');
        }
      }
    } catch {
      this.logger.warn('Verification notification queue could not be processed; it will retry.');
    } finally { this.running = false; }
    return sent;
  }
}
