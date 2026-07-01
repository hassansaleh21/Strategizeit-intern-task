#!/usr/bin/env bash
set -euo pipefail

KEYS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/keys"
mkdir -p "$KEYS_DIR"

PRIVATE_KEY="$KEYS_DIR/jwt-private.pem"
PUBLIC_KEY="$KEYS_DIR/jwt-public.pem"

echo "Generating RSA private key..."
openssl genrsa -out "$PRIVATE_KEY" 2048

echo "Deriving public key..."
openssl rsa -in "$PRIVATE_KEY" -pubout -out "$PUBLIC_KEY"

echo ""
echo "Done. Keys written to:"
echo "  $PRIVATE_KEY"
echo "  $PUBLIC_KEY"
echo ""
echo "Point your .env at them, e.g.:"
echo "  JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem"
echo "  JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem"
echo ""
echo "IMPORTANT: add /keys to .gitignore - never commit private keys."
