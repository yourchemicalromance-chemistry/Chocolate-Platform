import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

export interface SmsOtpProvider {
  send(destination: string, code: string): Promise<void>;
}

export const SMS_OTP_PROVIDER = Symbol('SMS_OTP_PROVIDER');

@Injectable()
export class UnconfiguredSmsOtpProvider implements SmsOtpProvider {
  async send(_destination: string, _code: string): Promise<void> {
    throw new ServiceUnavailableException('Mobile OTP delivery is not configured.');
  }
}

@Injectable()
export class EmailOtpDelivery {
  async send(destination: string, code: string, purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'): Promise<void> {
    const host = process.env.SMTP_HOST;
    const rawPort = process.env.SMTP_PORT;
    const port = Number(rawPort);
    const from = process.env.SMTP_FROM;
    const secureValue = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !rawPort || !Number.isInteger(port) || port < 1 || port > 65535 || !from ||
      !['true', 'false'].includes(secureValue ?? '') || Boolean(user) !== Boolean(pass)) {
      throw new ServiceUnavailableException('Email delivery is not configured.');
    }
    let transport: ReturnType<typeof nodemailer.createTransport> | undefined;
    try {
      transport = nodemailer.createTransport({
        host,
        port,
        secure: secureValue === 'true',
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        auth: user && pass ? { user, pass } : undefined,
      });
      const subject = purpose === 'PASSWORD_RESET' ? 'Your CHOCOLATE password recovery code' : 'Your CHOCOLATE verification code';
      const heading = purpose === 'PASSWORD_RESET' ? 'Password recovery' : 'Verify your email';
      const action = purpose === 'PASSWORD_RESET' ? 'reset your password' : 'verify your email address';
      await transport.sendMail({
        from,
        to: destination,
        subject,
        text: `CHOCOLATE\n\n${heading}\n\nYour code to ${action} is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;color:#3B211B;max-width:520px;margin:0 auto;padding:32px"><div style="font-size:13px;letter-spacing:4px;font-weight:bold;color:#9B6D42">CHOCOLATE</div><h1 style="font-size:24px">${heading}</h1><p>Use this code to ${action}:</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#6D3F2D">${code}</p><p>This code expires in <strong>10 minutes</strong>.</p><p style="color:#775E50">If you did not request this, you can ignore this email.</p></div>`,
      });
    } catch {
      throw new ServiceUnavailableException('Email delivery is temporarily unavailable.');
    } finally {
      transport?.close();
    }
  }
}
