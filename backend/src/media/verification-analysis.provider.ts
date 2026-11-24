import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface VerificationAnalysisInput {
  contentSha256: string;
}

export interface VerificationAnalysis {
  provider: string;
  initialStatus: 'PENDING' | 'MANUAL_REVIEW';
  checks: Record<string, boolean | string>;
}

export interface VerificationAnalysisProvider {
  analyze(input: VerificationAnalysisInput): Promise<VerificationAnalysis>;
}

export const VERIFICATION_ANALYSIS_PROVIDER = Symbol('VERIFICATION_ANALYSIS_PROVIDER');

@Injectable()
export class BuiltInReplayAnalysisProvider implements VerificationAnalysisProvider {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(input: VerificationAnalysisInput): Promise<VerificationAnalysis> {
    const duplicate = await this.prisma.humanVerification.findFirst({
      where: { contentSha256: input.contentSha256, status: { not: 'FAILED' } },
      select: { id: true },
    });
    return {
      provider: 'builtin-exact-replay-check',
      initialStatus: duplicate ? 'MANUAL_REVIEW' : 'PENDING',
      checks: {
        exactDuplicateDetected: Boolean(duplicate),
        challengeSessionConsumed: true,
        mediaIntegrityPassed: true,
        identityProven: false,
        note: 'Challenge and duplicate checks deter simple replay; they do not prove identity or liveness.',
      },
    };
  }
}
