import 'dotenv/config';
import { lookup } from 'node:dns/promises';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const trustedProxyAddresses = new Set(['127.0.0.1', '::1']);
  try {
    const hostGateway = await lookup('host.docker.internal');
    trustedProxyAddresses.add(hostGateway.address);
  } catch {
    // Host Caddy may connect over loopback when not running in Docker.
  }
  app.getHttpAdapter().getInstance().set('trust proxy', (address: string) => {
    const normalizedAddress = address.startsWith('::ffff:') ? address.slice(7) : address;
    return trustedProxyAddresses.has(normalizedAddress);
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
