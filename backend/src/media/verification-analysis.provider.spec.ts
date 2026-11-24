import { BuiltInReplayAnalysisProvider } from './verification-analysis.provider.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('BuiltInReplayAnalysisProvider', () => {
  it('queues novel content without claiming identity proof', async () => {
    const prisma = { humanVerification: { findFirst: vi.fn().mockResolvedValue(null) } };
    const provider = new BuiltInReplayAnalysisProvider(prisma as unknown as PrismaService);
    const result = await provider.analyze({ contentSha256: 'a'.repeat(64) });
    expect(result.initialStatus).toBe('PENDING');
    expect(result.checks.identityProven).toBe(false);
  });

  it('routes exact duplicate video bytes to manual review', async () => {
    const prisma = { humanVerification: { findFirst: vi.fn().mockResolvedValue({ id: 'prior' }) } };
    const provider = new BuiltInReplayAnalysisProvider(prisma as unknown as PrismaService);
    const result = await provider.analyze({ contentSha256: 'b'.repeat(64) });
    expect(result.initialStatus).toBe('MANUAL_REVIEW');
    expect(result.checks.exactDuplicateDetected).toBe(true);
  });
});
