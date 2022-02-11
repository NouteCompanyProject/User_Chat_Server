import { UserEntity } from "src/user/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("connectedUser")
export class ConnectedUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  socketId: string;

  @ManyToOne(() => UserEntity, user => user.connections)
  @JoinColumn()
  user: UserEntity;
}