import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto"

// Secrets we must store but never show again (AI provider keys). AES-256-GCM
// with a key from AFBA_ENCRYPTION_KEY, deliberately separate from
// BETTER_AUTH_SECRET so rotating sessions doesn't destroy stored secrets.
// Stored as "v1:<iv>:<tag>:<ciphertext>", all base64.

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super('AFBA_ENCRYPTION_KEY is not set. Add a long random value to the environment (e.g. `openssl rand -base64 32`) and restart the app.')
    this.name = 'MissingEncryptionKeyError'
  }
}

function key() {
  const secret = process.env.AFBA_ENCRYPTION_KEY
  if (!secret) throw new MissingEncryptionKeyError()
  // Any length of secret becomes a 32-byte key.
  return createHash('sha256').update(secret).digest()
}

export function isEncryptionConfigured() {
  return !!process.env.AFBA_ENCRYPTION_KEY
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return ['v1', iv, cipher.getAuthTag(), ciphertext].map(part => typeof part === 'string' ? part : part.toString('base64')).join(':')
}

export function decrypt(stored: string): string {
  const [version, iv, tag, ciphertext] = stored.split(':')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Unrecognized encrypted value')
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8')
}
