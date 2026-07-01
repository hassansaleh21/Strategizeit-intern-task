# Generates an RSA key pair for RS256 JWT signing.
# Requires OpenSSL on PATH (ships with Git for Windows: "Git\usr\bin").
#
# Usage (from repo root, PowerShell):
#   .\scripts\generate-rsa-keys.ps1

$ErrorActionPreference = "Stop"

$keysDir = Join-Path $PSScriptRoot "..\keys"
New-Item -ItemType Directory -Force -Path $keysDir | Out-Null

$privateKeyPath = Join-Path $keysDir "jwt-private.pem"
$publicKeyPath = Join-Path $keysDir "jwt-public.pem"

Write-Host "Generating RSA private key..."
openssl genrsa -out $privateKeyPath 2048

Write-Host "Deriving public key..."
openssl rsa -in $privateKeyPath -pubout -out $publicKeyPath

Write-Host ""
Write-Host "Done. Keys written to:"
Write-Host "  $privateKeyPath"
Write-Host "  $publicKeyPath"
Write-Host ""
Write-Host "Point your .env at them, e.g.:"
Write-Host "  JWT_PRIVATE_KEY_PATH=./keys/jwt-private.pem"
Write-Host "  JWT_PUBLIC_KEY_PATH=./keys/jwt-public.pem"
Write-Host ""
Write-Host "IMPORTANT: add /keys to .gitignore - never commit private keys."
