import { registerAs } from '@nestjs/config';
import { readFileSync } from 'fs';

/**
 * RS256 keys can be supplied two ways (pick one per environment):
 *  1. JWT_PRIVATE_KEY / JWT_PUBLIC_KEY  - raw PEM content, with real newlines
 *     escaped as literal "\n" (typical for .env files / most secret managers).
 *  2. JWT_PRIVATE_KEY_PATH / JWT_PUBLIC_KEY_PATH - path to .pem files on disk
 *     (convenient for local dev, see scripts/generate-rsa-keys.*).
 */
function loadKey(envValue: string | undefined, pathValue: string | undefined): string {
  if (envValue) {
    return envValue.replace(/\\n/g, '\n');
  }
  if (pathValue) {
    return readFileSync(pathValue, 'utf8');
  }
  throw new Error(
    'Missing JWT key configuration: set either the raw PEM env var or the *_PATH env var.',
  );
}

export default registerAs('jwt', () => ({
  privateKey: loadKey(process.env.JWT_PRIVATE_KEY, process.env.JWT_PRIVATE_KEY_PATH),
  publicKey: loadKey(process.env.JWT_PUBLIC_KEY, process.env.JWT_PUBLIC_KEY_PATH),
  accessTokenTtlSeconds: 900, // 15 minutes
  refreshTokenTtlDays: 7,
}));
