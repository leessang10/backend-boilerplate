import { Module } from '@nestjs/common';
import { UserController } from './presentation/user.controller';
import { UserService } from './application/user.service';
import { UserRepository } from './infrastructure/user.repository';
import { USER_READER_PORT } from './domain/ports/user-reader.port';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    {
      provide: USER_READER_PORT,
      useExisting: UserService,
    },
  ],
  exports: [UserService, USER_READER_PORT],
})
export class UserModule {}
