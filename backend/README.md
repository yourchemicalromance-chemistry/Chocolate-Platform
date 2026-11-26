<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Authentication API

The shared `AuthModule` exposes `POST /auth/signup` and `POST /auth/login`.
Signup accepts `fullName`, `email`, `mobileNumber`, `password`, `dateOfBirth`
(`YYYY-MM-DD`), and `is18PlusDeclared: true`. Passwords must be at least 8
characters and include a letter, number, and symbol. Mobile numbers are
canonicalized to E.164; national-format numbers are interpreted as India (+91),
matching the current app's phone flow. Email is trimmed and lowercased.

Login accepts `identifier` (email or mobile number) and `password`. Both
endpoints return a 15-minute signed bearer access token and a public user
summary. Password hashes are never included in responses. Configure
`JWT_SECRET` in the runtime environment with at least 32 bytes; the application
fails closed when it is absent or too short. Do not commit the secret.

Password recovery uses `POST /auth/forgot-password` with `{ "identifier": "..." }`;
the response is generic whether or not an account exists. If an account matches,
the recovery code is always sent to its registered email address. Verify it with
`POST /auth/verify-password-reset-otp` and `{ "identifier": "...", "code": "123456" }`;
the response contains a 15-minute `resetToken`. Finish with
`POST /auth/reset-password` and `{ "resetToken": "...", "newPassword": "...",
"confirmPassword": "..." }`. Recovery codes are purpose-separated from email
verification codes and use the existing per-account five-per-hour limit,
60-second cooldown, ten-minute expiry, and five-attempt limit. Reset tokens are
random, single-use, and stored only as hashes. Apply the additive
`20261117100000_password_recovery` migration before using these endpoints.
Password resets increment `User.tokenVersion`; both auth and media guards compare
the token claim with the database value on each protected request. The additive
`20261117110000_auth_token_revocation` migration defaults existing accounts to
version zero so existing tokens remain valid until expiration or password reset.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It installs `@nestjs/observe`, wires it into `AppModule` and `main.ts`, and writes the app key and secret into `.env`, which every `nest start` script (`start`, `start:dev`, `start:debug`) then loads. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/sdk) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

### Docker backend and private media storage

The application database is PostgreSQL on Aiven: Prisma declares `provider = "postgresql"`, and `PrismaService` uses `PrismaPg` with `DATABASE_URL` from `backend/.env` plus the project CA certificate. The local MySQL service has been removed from Compose; the existing `mysql_data` volume declarations are retained without a mounting service so their data is not removed. The root `docker-compose.yml` defines the NestJS backend as `chocolate-backend`, requires `JWT_SECRET` and the existing `REDIS_PASSWORD`, and binds API port 3000 to the host loopback address for host Caddy. The backend and Redis share the `chocolate_api` network for rate-limit access; Redis remains on its existing network as well.

Login rate limits use atomic Redis Lua scripts shared across backend instances. The per-15-minute thresholds are 5 failures per normalized email/mobile identifier, 20 per client IP, and 5 per IP/identifier pair. Reaching a threshold starts a temporary cooldown, progressively doubling from 60 seconds for identifier/IP buckets and 30 seconds for combined buckets, capped at 15 minutes. Streak state expires after 24 hours. Successful authentication clears the identifier and combined counters; it does not clear the IP counter. Correct credentials can still authenticate during cooldown so failed attempts cannot permanently lock out an account. Redis errors fail closed with HTTP 503. Identifier and IP values are HMACed with the existing `JWT_SECRET` before entering Redis keys.

Express trusts forwarded client IPs only when the immediate peer is loopback or Docker's resolved host-gateway address, matching host Caddy connecting to the backend's loopback-bound port. Keep the backend port private and let Caddy set `X-Forwarded-For`; do not expose port 3000 directly to untrusted networks.

The backend image is built from `backend/Dockerfile` and includes FFmpeg/FFprobe. It runs as UID/GID 1000 and mounts `/srv/chocolate-media` read/write at the same container path. The host `photos/`, `videos/`, `quarantine/`, and `temp/` directories must be writable by that UID/GID with private directory permissions before the service is started. Media bytes are streamed only by authenticated `/media/.../content` controller routes; no static public media directory is configured. The worker remains disabled in Compose until its database/storage deployment is explicitly enabled.
# Authentication configuration

Email OTP delivery requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, and `SMTP_FROM`; authenticated SMTP also uses `SMTP_USER` and `SMTP_PASS`. `OTP_HASH_SECRET` must be a random secret of at least 32 bytes and is kept separate from `JWT_SECRET`. Password recovery uses these same existing settings; no new provider or environment variables are required.

Google sign-in requires `GOOGLE_CLIENT_IDS`, a comma-separated list of the OAuth client IDs accepted by the API (Android, iOS, web/development as applicable). In Google Cloud Console, configure OAuth consent, Android OAuth credentials for the app package and signing SHA-1 fingerprints, iOS credentials for the bundle ID, and a Web OAuth client for web/development. Configure only public client IDs in Expo as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`; never place OAuth client secrets in the app.

The mobile OTP routes are API foundations only. No SMS provider is configured or contacted; `/auth/mobile/send-otp` returns HTTP 503 until a provider is deliberately configured behind `SmsOtpProvider`.
