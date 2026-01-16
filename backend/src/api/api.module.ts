import { Module } from '@nestjs/common';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController], // Defines the controllers belonging to this module
  providers: [], // Defines the services/providers to be instantiated by the injector
  exports: [], // Makes UserService available to other modules that import UserModule
})
export class UserModule {}
