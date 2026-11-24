# Media and human verification backend

`MediaModule` uses the existing JWT and Prisma services. Media bytes are written outside PostgreSQL; PostgreSQL stores ownership, processing/review state, storage keys, sizes and media properties.

## Routes

All routes require `Authorization: Bearer <access-token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/media/verification-sessions` | Issue a user-bound, expiring randomized interview challenge and one-time token. |
| `POST` | `/media/storage-reservations` | Atomically reserve quota and create an upload record. Photo requests send `mediaType` and `contentLength`; interview requests also send `verificationSessionId` and `challengeToken`. |
| `POST` | `/media/storage-reservations/:reservationId/content` | Stream raw `application/octet-stream` bytes with an exact `Content-Length`; processing completes synchronously. |
| `GET` | `/media/verification-status` | Return the caller's verification states. |
| `GET` | `/media/reviews/access` | Return whether the authenticated caller is the configured reviewer. |
| `GET` | `/media/reviews/pending` | Reviewer-only list of completed interview assets awaiting review. |
| `PATCH` | `/media/reviews/:verificationId` | Reviewer-only decision: `VERIFIED` or `FAILED`; a rejection requires a reason. |
| `GET` | `/media/:assetId/content` | Stream private content to its owner or, for interviews, the configured reviewer. Authenticated byte-range requests are supported for video playback. |
| `DELETE` | `/media/:assetId` | Delete an owned profile asset and its metadata. Verification videos are retained until account deletion. |
| `POST` | `/media/account-deletion` | Disable login/uploads and schedule media cleanup after the seven-day grace period. |

The client never supplies storage keys, filesystem paths, review status, or reviewer identity. Verification analysis is behind the `VerificationAnalysisProvider` injection token so a specialist provider can replace the basic exact-replay check. The randomized camera prompts and exact-duplicate hash are deterrence/integrity signals only; the backend does not evaluate facial movement or spoken phrases and they do not prove identity or liveness. Human decisions remain authoritative. No facial age estimation is used.

Each user may have only one active interview upload or unresolved review at a time; rejected submissions may be replaced. Reviewer decisions use the JWT subject, exclude the reviewer's own submissions, and are single-decision updates. Media remains in private filesystem storage and all stream requests re-check JWT ownership or reviewer authorization.

Reservations transition from `ACTIVE` to `RECEIVING` when the content endpoint atomically claims one. Failed requests release quota once; expired `ACTIVE` or `RECEIVING` reservations are reconciled at startup and every 60 seconds by `MediaUploadReservationWorker`. It removes only files derived from that incomplete reservation and asset, and skips committed reservations and any asset with a `HumanVerification` record. This upload lifecycle worker is independent of the account-deletion worker and does not enable `MEDIA_DELETION_WORKER_ENABLED`.

## Initial configuration values

These are configurable defaults, not frontend contracts. The media quota setting cannot exceed the approved 15,000,000,000-byte application allocation.

| Setting | Initial default |
| --- | --- |
| `MEDIA_STORAGE_ROOT` | `/srv/chocolate-media` |
| `MEDIA_STORAGE_MAX_BYTES` | `15000000000` |
| `MEDIA_MAX_UPLOAD_BYTES` | `262144000` |
| `MEDIA_MAX_VIDEO_DURATION_SECONDS` | `60` |
| `MEDIA_MAX_IMAGE_PIXELS` | `40000000` |
| `MEDIA_MAX_IMAGE_DIMENSION` | `2048` |
| `MEDIA_THUMBNAIL_DIMENSION` | `320` |
| `MEDIA_MAX_VIDEO_INPUT_PIXELS` | `8294400` |
| `MEDIA_MAX_VIDEO_INPUT_DIMENSION` | `3840` |
| `MEDIA_MAX_CONCURRENT_JOBS` | `1` |
| `MEDIA_RESERVATION_TTL_MS` | `3600000` |
| `VIDEO_VERIFICATION_SESSION_TTL_MS` | `900000` |
| `CHOCOLATE_REVIEWER_USER_ID` | Must be set to the reviewer account UUID by deployment configuration. |
| `MEDIA_DELETION_WORKER_ENABLED` | Disabled unless set to `true` after the database/storage deployment is approved. |
| `FFMPEG_PATH`, `FFPROBE_PATH` | `ffmpeg`, `ffprobe` on `PATH`. |

The Docker deployment mounts `/srv/chocolate-media` read/write at the same path and runs the backend as UID/GID 1000. The persistent directories are `photos/`, `videos/`, `quarantine/` and `temp/`; existing legacy storage keys under `profile-photos/` and `age-interviews/` remain readable. Ensure the host directories are owned/writable by UID/GID 1000 with private directory permissions before starting the service. Media is served only by authenticated controller routes and is not configured as static web content.

The database quota row performs atomic compare-and-reserve updates, including estimated source plus processed/thumbnail space. Processing concurrency is limited using the same shared row. This is an application quota, not an operating-system filesystem quota; VPS deployment must separately establish the approved storage directory and any filesystem-level hard limit.

## Deployment gate

Before enabling routes against a database, review and approve the additive migrations in `prisma/migrations/`, apply them through the approved Aiven process, provision `/srv/chocolate-media` with restrictive ownership/permissions and the selected quota, and install/verify FFmpeg with H.264 and WebP support. Set the reviewer UUID and account-deletion worker flag through protected deployment configuration. The upload-reservation worker runs independently; this implementation does not create the VPS directory, change mounts/quotas, alter Docker, or run migrations.

`MediaDeletionWorker` retries due seven-day account-deletion jobs and remains controlled by `MEDIA_DELETION_WORKER_ENABLED`. It deletes account media and metadata while retaining the User row and verification decision/session audit records. `MediaUploadReservationWorker` handles only incomplete expired upload attempts and never removes committed verification media.
