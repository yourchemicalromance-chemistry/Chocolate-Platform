import { VerificationNotificationWorker } from './verification-notification.worker.js';

describe('VerificationNotificationWorker', () => {
  it('sends a decision email and marks the outbox item sent', async () => {
    const prisma = {
      verificationNotification: {
        findMany: vi.fn().mockResolvedValue([{ id: 'n1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({ id: 'n1', attempts: 1, verification: { status: 'VERIFIED', owner: { email: 'private@example.test' } } }),
      },
    } as any;
    const email = { sendVerificationDecision: vi.fn().mockResolvedValue(undefined) } as any;
    const worker = new VerificationNotificationWorker(prisma, email);
    await expect(worker.drain(new Date('2026-11-25T00:00:00.000Z'))).resolves.toBe(1);
    expect(email.sendVerificationDecision).toHaveBeenCalledWith('private@example.test', true);
    expect(prisma.verificationNotification.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { id: 'n1', status: 'PROCESSING' }, data: expect.objectContaining({ status: 'SENT', sentAt: expect.any(Date) }),
    }));
  });

  it('retries provider failures without storing addresses or provider details in logs', async () => {
    const prisma = {
      verificationNotification: {
        findMany: vi.fn().mockResolvedValue([{ id: 'n1' }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({ id: 'n1', attempts: 1, verification: { status: 'FAILED', owner: { email: 'private@example.test' } } }),
      },
    } as any;
    const email = { sendVerificationDecision: vi.fn().mockRejectedValue(new Error('provider secret')) } as any;
    const worker = new VerificationNotificationWorker(prisma, email);
    await expect(worker.drain(new Date('2026-11-25T00:00:00.000Z'))).resolves.toBe(0);
    expect(prisma.verificationNotification.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING', lastErrorCode: 'SMTP_DELIVERY_FAILED' }),
    }));
    expect(JSON.stringify(prisma.verificationNotification.updateMany.mock.calls)).not.toContain('private@example.test');
  });
});
