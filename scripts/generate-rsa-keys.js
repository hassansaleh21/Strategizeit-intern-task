// Generates an RSA key pair for RS256 JWT signing using Node's built-in
// crypto module - no OpenSSL install required.
//
// Usage (from repo root):
//   node scripts/generate-rsa-keys.js

const { generateKeyPairSync } = require('crypto');
const { mkdirSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '..', 'keys');
if (!existsSync(keysDir)) {
  mkdirSync(keysDir, { recursive: true });
}

const privateKeyPath = path.join(keysDir, 'jwt-private.pem');
const publicKeyPath = path.join(keysDir, 'jwt-public.pem');

console.log('Generating RSA key pair (2048-bit)...');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

writeFileSync(privateKeyPath, privateKey);
writeFileSync(publicKeyPath, publicKey);

console.log('');
console.log('Done. Keys written to:');
console.log(`  ${privateKeyPath}`);
console.log(`  ${publicKeyPath}`);
console.log('');
console.log('Point your .env at them, e.g.:');
console.log('  JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem');
console.log('  JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem');
console.log('');
console.log('IMPORTANT: /keys is already gitignored - never commit private keys.');
