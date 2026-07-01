# A1-01 — AuthController.login()

Implements `POST /api/v1/auth/login` per the ticket:

- Validates email/password via `CredentialsService.validatePassword()`
- Issues a 15-minute RS256 access token
- Issues a 7-day refresh token, stored in the DB as a **bcrypt hash only** (raw token is
  returned to the client once and never persisted)
- 403 for inactive users, 401 for bad credentials, 422 for a malformed email
- Password is never logged anywhere in the flow

## Files

```
package.json / tsconfig.json / tsconfig.build.json / nest-cli.json   # standalone Nest project
prisma/schema.prisma                                    # User + RefreshToken models
src/main.ts                                              # bootstrap: versioning, 422 pipe, Swagger
src/app.module.ts
src/prisma/prisma.service.ts / prisma.module.ts          # stub — delete if you already have one
src/auth/
  auth.module.ts
  auth.controller.ts          # POST /api/v1/auth/login
  auth.service.ts             # 401 / 403 decision logic + token issuance
  credentials.service.ts      # validatePassword() — DB lookup + bcrypt compare
  token.service.ts            # RS256 access token + hashed refresh token
  config/jwt.config.ts        # loads RSA keys from env or file path
  interfaces/jwt-payload.interface.ts
  dto/login.dto.ts            # class-validator email/password rules
  dto/login-response.dto.ts
  dto/user-response.dto.ts    # strips password before it ever leaves the service
  auth.service.spec.ts
  auth.controller.spec.ts
src/common/interceptors/redact-sensitive-fields.interceptor.ts
scripts/generate-rsa-keys.ps1                           # Windows (openssl via Git for Windows)
scripts/generate-rsa-keys.sh                             # Mac/Linux/CI
.env.example
```

This is a complete, runnable Nest project on its own. You have two options:

### Option A — run it standalone (fastest way to verify the acceptance criteria)

Follow steps 1-4 below, then `npm run start:dev`. Swagger UI is at
`http://localhost:3000/docs`.

### Option B — fold it into your existing Formify monorepo

Copy `src/auth/` and `src/common/interceptors/` into `users-service`. **Delete**
`src/prisma/` (you already have Prisma wired up) and repoint the imports in
`credentials.service.ts`, `token.service.ts`, and `auth.module.ts` to your real
`PrismaService`/`PrismaModule` (e.g. `@formify/common`). Merge the `User` and
`RefreshToken` models into your existing `schema.prisma` instead of using the one here
(drop its `generator`/`datasource` block, you already have those). Merge the
`ValidationPipe`/interceptor lines from `src/main.ts` into your existing bootstrap rather
than using this `main.ts` wholesale.

## 1. Install deps

```powershell
npm install
```

`bcryptjs` (not native `bcrypt`) is used throughout, consistent with the rest of Formify.

## 2. Generate RSA keys (local dev)

```powershell
npm run generate:keys
```

This uses Node's built-in `crypto` module — no OpenSSL install needed. It writes
`keys/jwt-private.pem` and `keys/jwt-public.pem`. Already gitignored — never commit these.

(`scripts/generate-rsa-keys.ps1` / `.sh` are OpenSSL-based alternatives if you have it on
PATH — e.g. via Git for Windows at `Git\usr\bin\openssl.exe` — but the Node script above is
the recommended path since it has no extra dependency.)

## 3. Wire up `.env`

Copy `.env.example` to `.env` and fill in `DATABASE_URL` plus the key paths.

## 4. Migrate + generate the Prisma client

```powershell
npx prisma generate
npx prisma migrate dev --name add_refresh_tokens
```

## 5. Seed a test user

```powershell
npm run prisma:seed
```

Creates two users so you can exercise every path in the acceptance criteria:

| Email | Password | isActive | Expected result |
|---|---|---|---|
| `test@example.com` | `Password123!` | true | 200 |
| `inactive@example.com` | `Password123!` | false | 403 |

(any other email/password combo, or a malformed email, hits the 401/422 paths)

## 6. Run it

```powershell
npm run start:dev
```

`POST http://localhost:3000/api/v1/auth/login` with `{ "email": "...", "password": "..." }`.

## About the 422

By default Nest's `ValidationPipe` throws a **400**, not the 422 the ticket asks for.
`src/main.ts` already wires a custom `exceptionFactory` that turns any DTO validation failure
(e.g. malformed email) into a 422. If you're merging this into an existing bootstrap that
already has a global `ValidationPipe`, just add the `exceptionFactory` to that existing config
instead — Nest only uses one global pipe.

## 7. Run the tests

```powershell
npm test
```

Covers: 200 with full response contract, 401 on bad credentials, 403 on inactive account.

## Response contract (200)

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "9f1c2e...(128 hex chars)",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "hassan@example.com",
    "firstName": "Hassan",
    "lastName": null,
    "isActive": true
  }
}
```

## Design notes

- **401 vs 403 ordering**: `CredentialsService.validatePassword()` intentionally does *not*
  check `isActive` — it only confirms the email exists and the password matches. `AuthService`
  checks `isActive` afterward. This means an inactive user with the *correct* password gets a
  403 (account exists, they just can't log in), while a wrong password on an inactive account
  still correctly returns 401 (never leak that the account exists via the error code alone
  before credentials are verified).
- **Refresh token storage**: the raw refresh token is only ever held in memory during the
  request and returned once. Only its bcrypt hash is written to `refresh_tokens`. This matches
  how you're already storing hashed values instead of secrets in the DB.
- **No password logging**: `CredentialsService` logs only the normalized email on failure,
  never the password. The `RedactSensitiveFieldsInterceptor` is a second line of defense at
  the HTTP layer in case something else in the app logs request bodies later.
- A refresh/rotate endpoint (`POST /api/v1/auth/refresh`) isn't part of this ticket, but
  `TokenService.generateRefreshToken()` is written so a future ticket can add
  `validateRefreshToken()` next to it without reshaping this code.
