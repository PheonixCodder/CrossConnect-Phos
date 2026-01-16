import { Controller, Post, Body } from '@nestjs/common';
import { StoresRepository } from 'src/supabase/repositories/stores.repository';
import { UpdateStoreCredentialsDto } from './dto/updateStoreStatus.dto';
import { CryptoService } from 'src/common/crypto.service';

@Controller('users')
export class UserController {
  // Inject the CatsService via the constructor
  constructor(
    private storeRepo: StoresRepository,
    private cryptoService: CryptoService,
  ) {}

  @Post()
  async UpdateStoreStatus(@Body() dto: UpdateStoreCredentialsDto) {
    const encrypted = this.cryptoService.encrypt(dto.credentials);

    await this.storeRepo.upsertCredentials(dto.storeId, encrypted);
  }
}
