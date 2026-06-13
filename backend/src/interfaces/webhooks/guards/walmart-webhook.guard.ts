import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  RawBodyRequest,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  STORE_CREDENTIALS_REPOSITORY,
  StoreCredentialsRepositoryPort,
} from '../../../domain/repositories/repository-ports';
import { CryptoService } from '../../../shared/crypto/crypto.service';

@Injectable()
export class WalmartWebhookGuard implements CanActivate {
  constructor(
    @Inject(STORE_CREDENTIALS_REPOSITORY)
    private readonly storeCredentialsRepo: StoreCredentialsRepositoryPort,
    private crypto: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RawBodyRequest<any>>();

    const signature = req.headers['wm_sec.auth_signature'] as string;
    const { storeId } = req.params;

    if (!signature || !req.rawBody) {
      throw new UnauthorizedException('Missing signature');
    }

    const credentials = await this.storeCredentialsRepo.getCredentialsByStoreId(
      storeId as string,
    );
    const creds =
      typeof credentials === 'string'
        ? JSON.parse(credentials)
        : credentials;

    const expected = crypto
      .createHmac('sha256', this.crypto.decrypt(creds.clientSecret) as string)
      .update(req.rawBody as crypto.BinaryLike)
      .digest('base64');

    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
