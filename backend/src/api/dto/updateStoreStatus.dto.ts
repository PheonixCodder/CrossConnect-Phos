import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class UpdateStoreCredentialsDto {
  @IsString()
  @IsNotEmpty()
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  readonly storeId: string;

  @IsObject()
  readonly credentials: Record<string, unknown>;
}
