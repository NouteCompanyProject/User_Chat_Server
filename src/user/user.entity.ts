import { ConnectedUserEntity } from "src/chat/entities/connected-user.entity";
import { JoinedRoomEntity } from "src/chat/entities/joined-room.entity";
import { MessageEntity } from "src/chat/entities/message.entity";
import { RoomEntity } from "src/chat/entities/room.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("user")
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  username: string;

  @Column({unique: true})
  email: string;

  @Column({select: false})
  password: string;

  @ManyToMany(() => RoomEntity, room => room.users)
  rooms: RoomEntity[]

  @OneToMany(() => ConnectedUserEntity, connection => connection.user)
  connections: ConnectedUserEntity[];

  @OneToMany(() => JoinedRoomEntity, joinedRoom => joinedRoom.room)
  joinedRooms: JoinedRoomEntity[];

  @OneToMany(() => MessageEntity, message => message.user)
  messages: MessageEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
    this.username = this.username.toLowerCase();
  }
}