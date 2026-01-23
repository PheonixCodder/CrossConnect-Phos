import * as crypto from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class CryptoService implements OnModuleInit {
  private readonly algorithm = 'aes-256-gcm';
  private key: Buffer;

  onModuleInit() {
    const keyHex = process.env.CREDENTIALS_ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error(
        'CREDENTIALS_ENCRYPTION_KEY environment variable is required',
      );
    }
    this.key = Buffer.from(keyHex, 'hex');
    if (this.key.length !== 32) {
      throw new Error(
        'CREDENTIALS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
      );
    }
  }

  encrypt(payload: any) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyVersion: 1,
    };
  }

  decrypt(encrypted: any) {
    if (!encrypted.ciphertext || !encrypted.iv || !encrypted.tag) {
      throw new Error('Invalid encrypted payload structure');
    }

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encrypted.iv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}
