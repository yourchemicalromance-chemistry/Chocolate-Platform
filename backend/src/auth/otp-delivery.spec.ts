import { ServiceUnavailableException } from '@nestjs/common';
import { EmailOtpDelivery } from './otp-delivery.js';

const { createTransport, sendMail, close } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  close: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  default: { createTransport },
}));

describe('EmailOtpDelivery', () => {
  const delivery = new EmailOtpDelivery();

  beforeEach(() => {
    process.env.SMTP_HOST = 'smtp.example.test';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_FROM = 'CHOCOLATE <no-reply@example.test>';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test-user';
    process.env.SMTP_PASS = 'test-password';
    createTransport.mockReturnValue({ sendMail, close });
    sendMail.mockResolvedValue({});
  });

  afterEach(() => {
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS']) delete process.env[key];
    vi.clearAllMocks();
  });

  it('sends the code through configured Nodemailer transport and closes it', async () => {
    await delivery.send('ada@example.test', '123456');
    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.example.test', port: 587, secure: false,
      auth: { user: 'test-user', pass: 'test-password' },
    }));
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'ada@example.test', text: expect.stringContaining('123456') }));
    expect(close).toHaveBeenCalledOnce();
  });

  it('sends branded email with the recipient code and expiry in text and HTML', async () => {
    await delivery.send('ada@example.test', '654321');
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'ada@example.test',
      subject: expect.stringContaining('CHOCOLATE'),
      text: expect.stringMatching(/CHOCOLATE[\s\S]*654321[\s\S]*10 minutes/),
      html: expect.stringMatching(/CHOCOLATE[\s\S]*654321[\s\S]*10 minutes/),
    }));
  });

  it('does not log OTPs and reports SMTP send failures without exposing provider details', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sendMail.mockRejectedValueOnce(new Error('provider rejected secret 654321'));
    await expect(delivery.send('ada@example.test', '654321')).rejects.toThrow('Email delivery is temporarily unavailable.');
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
    log.mockRestore();
    error.mockRestore();
  });

  it('fails clearly when SMTP is not configured', async () => {
    delete process.env.SMTP_HOST;
    await expect(delivery.send('ada@example.test', '123456')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects incomplete or invalid SMTP configuration', async () => {
    process.env.SMTP_PORT = '0';
    await expect(delivery.send('ada@example.test', '123456')).rejects.toBeInstanceOf(ServiceUnavailableException);
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test-user';
    delete process.env.SMTP_PASS;
    await expect(delivery.send('ada@example.test', '123456')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
