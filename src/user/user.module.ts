import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserHelperService } from './service/user-helper.service';
import { UserService } from './service/user.service';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserHelperService],
  exports: [UserService]
})
export class UserModule {}
