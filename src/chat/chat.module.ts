import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { ConnectedUserService } from './connected-user.service';
import { ConnectedUserEntity } from './entities/connected-user.entity';
import { JoinedRoomEntity } from './entities/joined-room.entity';
import { MessageEntity } from './entities/message.entity';
import { RoomEntity } from './entities/room.entity';
import { ChatGateway } from './gateway/chat.gateway';
import { JoinedRoomService } from './joined-room.service';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@Module({
    imports: [AuthModule, UserModule,
      TypeOrmModule.forFeature([
        RoomEntity,
        ConnectedUserEntity,
        MessageEntity,
        JoinedRoomEntity
      ])
    ],
    providers: [ChatGateway, RoomService, ConnectedUserService, JoinedRoomService, MessageService]
})
export class ChatModule { }