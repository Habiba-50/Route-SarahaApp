# Saraha App 

An anonymous messaging API — think "Saraha" / "NGL": anyone with your profile link can send you a message (text and/or up to 2 image attachments) without revealing their identity, unless they're logged in. Built with Node.js, Express, MongoDB and Redis.

> Repository: [Habiba-50/Route-SarahaApp](https://github.com/Habiba-50/Route-SarahaApp) — code lives under `/Code`.

## Table of Contents

- [Features](#features)
- [Tech Stack & Dependencies](#tech-stack--dependencies)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [REST API Overview](#rest-api-overview)
- [Data Models](#data-models)
- [Security](#security)
- [Known Issues](#known-issues)
- [Roadmap](#roadmap)
- [Author](#author)

## Features

- **Email/password signup** with OTP email verification (6-digit code, 2-minute TTL, capped resend attempts, temporary block after 3 tries).
- **Google Sign-In** (signup and login) via `google-auth-library`, auto-linking/creating an account from the verified Google ID token.
- **Login protections**: 5 failed attempts temporarily bans the account (5 minutes) via Redis counters; successful login clears the counters.
- **Optional Two-Step Verification (2SV)**: once enabled, a fresh OTP is required for login after the previous verification is more than 24 hours old.
- **JWT access/refresh tokens**, scoped by audience (`User` vs `System`/Admin) and token type (`ACCESS`/`REFRESH`), with per-token revocation stored in Redis (logout one session or all sessions).
- **Forgot/reset password flow** via OTP, which also revokes all of the user's existing sessions.
- **Profile management**: profile picture, cover images (up to 2), and a "gallery" that retains previous profile pictures when replaced.
- **Public profile sharing**: anyone can fetch a user's public profile (name, email, phone, picture) by ID — this is the link people share to receive anonymous messages.
- **Anonymous or identified messaging**: `POST /message/:receiverId` works with or without a logged-in sender — if an `Authorization` header is present it's decoded and the message is attributed, otherwise `senderId` is left empty (anonymous).
- **Message attachments**: up to 2 images per message, stored locally under `/uploads`.
- **IP + country-aware rate limiting** on the global app and on `/auth/login`, backed by a Redis-based store (stricter limits for Egyptian IPs in this build, generous limits for local/private IPs during development).
- **Encrypted phone numbers** (AES-256-CBC) at rest, decrypted only when returned from `shareProfile`.

## Tech Stack & Dependencies

**Runtime:** Node.js (`>=22.21.1`), Express 5, MongoDB via Mongoose, Redis.

| Package | Purpose |
|---|---|
| `express` | HTTP server & routing |
| `mongoose` | MongoDB models & queries |
| `redis` | OTP storage, rate-limit counters, revoked-token blacklist, login-attempt counters |
| `jsonwebtoken` | Access/refresh token signing & verification |
| `bcrypt` | Password hashing |
| `joi` | Request validation schemas |
| `multer` | Multipart file uploads (profile/cover/message images) |
| `nodemailer` | Sending OTP emails via Gmail |
| `google-auth-library` | Verifying Google ID tokens for Google sign-in/signup |
| `helmet` | Security-related HTTP headers |
| `cors` | Cross-origin requests |
| `express-rate-limit` | Rate limiting (custom Redis store) |
| `geoip-lite` | Looking up the requester's country from IP, used to vary rate limits |
| `dotenv` | Loading environment variables from `config/.env.*` |
| `cross-env` | Cross-platform `NODE_ENV` setting in npm scripts |

No dedicated dev-dependency list is declared beyond the packages above; `node --watch-path` is used for live-reload in development and `pm2` is expected to be available globally for production.

## Project Structure

```
Code/
├── config/
│   └── config.service.js        # loads config/.env.development or .env.production, exports all env vars
├── src/
│   ├── main.js                  # entry point, calls bootstrap()
│   ├── app.bootstrap.js         # express app setup, middleware, rate limiter, route mounting
│   ├── DB/
│   │   ├── connection.db.js      # mongoose connection + syncIndexes
│   │   ├── redis.connection.db.js
│   │   ├── db.service.js        # generic find/findOne/create/update/delete helpers used by all modules
│   │   ├── index.js
│   │   └── model/
│   │       ├── user.model.js
│   │       └── message.model.js
│   ├── middleware/
│   │   ├── authentication.middleware.js  # authentication() + authorization()
│   │   └── validation.middleware.js      # Joi-schema request validation
│   ├── common/
│   │   ├── enums/                # GenderEnum, RoleEnum, ProviderEnum, AudienceEnum, TokenTypeEnum, LogoutEnum, EmailEnum
│   │   ├── services/
│   │   │   └── redis.service.js  # redis get/set/ttl/keys/delete + Redis key builders (OTP, revoked tokens, login trials)
│   │   ├── validation.js         # shared Joi field definitions (email, password, phone, ObjectId, file, otp, ...)
│   │   └── utils/
│   │       ├── email/            # nodemailer sender, email template, async email EventEmitter
│   │       ├── multer/           # local disk storage config + mimetype/size validation
│   │       ├── security/         # bcrypt hashing, AES-256 phone encryption, OTP generation, JWT helpers
│   │       ├── response/         # successResponse() envelope + ErrorException/* helpers + globalErrorHandling
│   │       └── otp.js            # 6-digit numeric OTP generator
│   └── modules/
│       ├── auth/                 # signup, email confirmation, login, Google auth, forgot/reset password, 2SV
│       ├── user/                 # profile, share-profile, profile/cover images, logout, rotate-token, update-password
│       └── message/               # send/get/list/delete anonymous messages
└── uploads/                      # local file storage for profile pics, cover images, message attachments (gitignored)
```

## Getting Started

### Prerequisites

- Node.js `22.21.1` (see `engines` in `package.json`)
- A running MongoDB instance
- A running Redis instance (required at boot — OTPs, rate limiting and token revocation all depend on it)
- A Gmail account (with an **App Password**) if you want outgoing OTP emails to work
- A Google OAuth Web Client ID if you want Google sign-in/signup to work

### Installation

```bash
cd Code
npm install
```

### Environment files

The app loads `config/.env.development` or `config/.env.production` depending on `NODE_ENV` (see `config/config.service.js`). Both files are gitignored, so create whichever one you need under `Code/config/` with the variables listed below.

### Running

```bash
# development (auto-restarts on file changes)
npm run start:dev

# production (runs under pm2, cluster mode)
npm run start:prod
```

By default the server listens on port `7000` (override with `PORT`).

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (defaults to `7000`) |
| `APPLICATION_NAME` | Used as the email "from" display name (defaults to `Saraha App`) |
| `DB_URI` | MongoDB connection string (defaults to `mongodb://127.0.0.1:27017/Saraha_App`) |
| `REDIS_URL` | Redis connection string |
| `SALT_ROUND` | bcrypt salt rounds (defaults to `10`) |
| `ENCRYPTION_KEY` | 32-byte key used to AES-256-CBC encrypt/decrypt phone numbers |
| `EMAIL_APP` | Gmail address used to send OTP/notification emails |
| `EMAIL_PASS` | Gmail App Password for `EMAIL_APP` |
| `User_JWT_SECRET` | Signing secret for regular-user access tokens |
| `User_REFRESH_JWT_SECRET` | Signing secret for regular-user refresh tokens |
| `System_JWT_SECRET` | Signing secret for admin/system access tokens |
| `System_REFRESH_JWT_SECRET` | Signing secret for admin/system refresh tokens |
| `ACCESS_EXPIRES_IN` | Access token lifetime, in seconds |
| `REFRESH_EXPIRES_IN` | Refresh token lifetime, in seconds |
| `WEB_CLIENT_ID` | Google OAuth Web Client ID, used to verify Google ID tokens |
| `NODE_ENV` | `development` or `production` — selects which `.env.*` file is loaded |

> **Note:** the OTP-email helper in `common/utils/security/otpService.js` reads `process.env.EMAIL_USER` / `process.env.EMAIL_PASS` directly (not through `config.service.js`), while the actual email sender used by the auth flow (`common/utils/email/send.email.js`) uses `EMAIL_APP` / `EMAIL_PASS` from `config.service.js`. If you rely on OTP emails, set `EMAIL_APP` and `EMAIL_PASS` — `otpService.js`'s `sendOTPEmail` export is currently unused by the auth flow.

## Authentication

- Send the token **raw** in the `Authorization` header — **no `Bearer ` prefix** (e.g. `Authorization: eyJhbGciOi...`).
- Every token encodes its `tokenType` (`ACCESS`/`REFRESH`) and `audience` (`User`/`System`) in its JWT `aud` claim; `decodeToken` rejects a token whose type isn't allowed for the route calling it.
- `POST /user/rotate-token` requires a **refresh** token and only issues new credentials once the current access token has **less than 5 minutes left** — otherwise it responds with a conflict ("Current access token is still valid").
- Logging out revokes the current session's refresh token (stored in Redis by its JWT ID); passing `flag` as `All` instead revokes every session by bumping `changeCredentialsTime`, which invalidates all tokens issued before that moment.
- Changing or resetting your password also sets `changeCredentialsTime`, signing you out everywhere.

## Rate Limiting

Two rate limiters, both backed by a custom Redis store (so limits survive restarts and work across multiple instances):

- **Global** (`app.bootstrap.js`): a 2-minute window; by default, requests from Egyptian IPs are capped at 4, everything else (including local/private IPs useful for development) gets 100.
- **Login** (`auth.controller.js`): a 2-minute window specifically on `POST /auth/login`; Egyptian IPs get 5 attempts per window, other geolocated IPs get 0 (blocked) — intended as a template to tune per deployment, not a finished policy (see [Known Issues](#known-issues)).

Both report `429 Too Many Requests` with a plain `{ "message": "Too Many Requests" }` body when exceeded.

## REST API Overview

All responses use the shape `{ status, message, data }` (see `successResponse`). Errors use `{ status, errorMessage, extra, stack }` (stack/errorMessage trimmed in production).

### Auth — `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Register with email/password; sends a confirmation OTP by email |
| PATCH | `/auth/confirm-email` | — | Confirm email with `{ email, otp }` |
| PATCH | `/auth/resend-otp` | — | Resend the confirm-email OTP |
| POST | `/auth/login` | — | Email/password login (rate-limited, account-ban after 5 failed attempts) |
| POST | `/auth/confirm-login` | — | Complete login when 2-Step Verification is required, with `{ email, otp }` |
| POST | `/auth/signup/gmail` | — | Signup/auto-login with a Google ID token (`{ idToken }`) |
| POST | `/auth/login/gmail` | — | Login with a Google ID token |
| POST | `/auth/forgot-password-otp` | — | Request a password-reset OTP by email |
| POST | `/auth/verify-otp-password` | — | Verify the password-reset OTP |
| PATCH | `/auth/reset-password` | — | Reset the password with `{ email, password, confirmPassword }` |
| POST | `/auth/enable-2sv` | Access token | Enable Two-Step Verification (sends an OTP) |
| POST | `/auth/verify-2sv` | Access token | Confirm Two-Step Verification with `{ otp }` |

### User — `/user`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/user/profile` | Access token (User role) | Get the logged-in user's own profile |
| GET | `/user/:userId/share-profile` | — | Public profile lookup (name, email, phone, profile picture) — this is the link anonymous senders use |
| PATCH | `/user/profile-image` | Access token | Upload/replace the profile picture (`attachment` field, image or video, ≤5MB); the previous picture moves into `gallery` |
| PATCH | `/user/profile-cover-image` | Access token | Upload up to 2 cover images (`attachments` field, images only, ≤5MB each) |
| DELETE | `/user/profile-image` | Access token | Delete the current profile picture (`{ imagePath }` in the body) |
| POST | `/user/rotate-token` | Refresh token (User role) | Exchange a refresh token for a new access/refresh pair, only when the current access token is near expiry |
| PATCH | `/user/update-password` | Access token | Change password with `{ oldPassword, newPassword }` — also revokes all other sessions |
| POST | `/user/logout` | Access token | Log out: `{ flag }` — default revokes the current session only, `All` (`0`) revokes every session |

### Message — `/message`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/message/:receiverId` | Optional | Send a message to a user; works signed-out (anonymous, `senderId` unset) or signed-in (message is attributed). Body: `content` (text) and/or up to 2 `attachments` (images). At least one of the two is required. |
| GET | `/message/list` | Access token | List every message where the logged-in user is sender or receiver |
| GET | `/message/:messageId` | Access token | Get a single message you sent or received |
| DELETE | `/message/:messageId` | Access token | Delete a message — **only the receiver can delete it** (see [Known Issues](#known-issues)) |

## Data Models

**User** (`user.model.js`): `firstName`/`lastName` (also exposed as a virtual `userName`), `email` (unique), `password` (required only for `System`-provider accounts), `phone` (AES-256 encrypted), `DOB`, `gender`, `provider` (`System`/`Google`), `role` (`Admin`/`User`), `profilePic`, `profileCoverPic[]`, `gallery[]`, `confirmEmail`, `changeCredentialsTime`, `isVerified`, `twoStepVerification`. Unverified accounts auto-expire 24 hours after creation via a partial TTL index on `createdAt`.

**Message** (`message.model.js`): `content` (required only if there's no attachment), `attachment[]`, `receiverId` (required, references `User`), `senderId` (unset for anonymous messages).

## Security

- Passwords hashed with `bcrypt` (configurable salt rounds).
- Phone numbers encrypted at rest with AES-256-CBC, decrypted only in `shareProfile`.
- JWTs are scoped by audience (user vs. system/admin) and type (access vs. refresh), with per-session revocation tracked in Redis so a logout or password change takes effect immediately, not just at token expiry.
- OTPs are stored hashed (bcrypt) in Redis with a short TTL, capped resend attempts, and a temporary block after repeated requests.
- Login is protected against brute-forcing: failed attempts are counted per email and the account is temporarily banned after 5 failures.
- File uploads are filtered by MIME type (`fileFieldValidation`) and size (`multer` `limits.fileSize`) before being written to disk.
- `helmet` and `cors` are applied globally; `app.set("trust proxy", true)` is enabled so rate limiting can key off the real client IP behind a proxy.

## Known Issues

These are real gaps found while reading the current code, listed with their exact location so they're easy to track down:

1. **Only the receiver can delete a message.** `message.service.js`'s `deleteMessage` filters by `receiverId: user._id` only — the sender has no way to delete a message they sent (anonymous senders, by design, can't delete anything either since they have no identity on the message).
2. **`otpService.js`'s `sendOTPEmail`/`generateOTP` exports are dead code.** The real OTP flow (`auth.service.js`) uses its own `createNumberOtp()` (from `utils/otp.js`) and `send.email.js`'s `sendEmail`, which read `EMAIL_APP`/`EMAIL_PASS` from `config.service.js`. `otpService.js` instead reads `process.env.EMAIL_USER`/`process.env.EMAIL_PASS` directly and is never called — easy to mistake for the active implementation when configuring environment variables.
3. **`loginGmail` references an undefined variable.** In `auth.service.js`, `loginGmail`'s final line calls `createLoginCredentials({ user: checkUser, issuer })`, but the function's local variable is named `user`, not `checkUser` — this will throw a `ReferenceError` at runtime whenever `loginGmail` is actually reached (it currently only gets called indirectly from `signupGmail` when a Google account already exists).
4. **`loginGmail`'s provider check is always true.** `if (!user?.provider === ProviderEnum.Google)` applies `!` to `user?.provider` *before* comparing to `ProviderEnum.Google`, so the condition evaluates based on `(!user?.provider) === ProviderEnum.Google` rather than checking whether the provider actually is/isn't Google — the intended guard against cross-provider login doesn't work as written.
5. **The global rate limiter skips both failed and successful requests.** `app.bootstrap.js`'s limiter sets both `skipFailedRequests: true` and `skipSuccessfulRequests: true`, which — combined with the custom Redis store's `decrement`/`resetKey` — means very few real requests end up counted toward the limit; worth double-checking this is the intended behavior before relying on it in production.
6. **Country-based rate limiting is hardcoded to Egypt.** Both the global and login limiters special-case `geo.country === "EG"` with every other geolocated country getting a limit of `0` (fully blocked). This looks like a development-time placeholder rather than an intended production policy.
7. **`db.service.js`'s `updateOne`/`findOneAndUpdate`/`findByIdAndUpdate` always append `$inc: { __v: 1 }`.** If a caller's own `update` object already uses a `$set`/`$inc`/etc. on `__v`, or if `update` isn't a plain `$`-operator object (e.g. a flat field map, as `resendOtp`'s `userModel.updateOne({...})` call effectively is, missing its `filter`/`update` wrapper entirely), this can throw or silently no-op. `toResendOtp` in `db.service.js` looks unused/dead by the same pattern.
8. **No automated tests.** There's currently no test suite in the repository.

## Roadmap

- Add automated tests (unit + integration).
- Move file storage to cloud object storage (e.g. S3) instead of local disk, for multi-instance deployments.
- Revisit and document the rate-limiting policy for non-Egyptian traffic.
- Add pagination to `GET /message/list`.
- Add a Postman/OpenAPI collection for the API.
- Containerize with Docker for consistent local/prod setup.

## Author

**Habiba Mohamed**
GitHub: [@Habiba-50](https://github.com/Habiba-50)