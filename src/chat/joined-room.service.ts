import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserI } from "src/user/user.interface";
import { Repository } from "typeorm";
import { JoinedRoomEntity } from "./entities/joined-room.entity";
import { JoinedRoomI } from "./entities/joined-room.interface";
import { RoomI } from "./entities/room.interface";

@Injectable()
export class JoinedRoomService {
  constructor(
    @InjectRepository(JoinedRoomEntity)
    private readonly joinedRoomRepository: Repository<JoinedRoomEntity>
  ) { }

  async create(joinedRoom: JoinedRoomI): Promise<JoinedRoomI> { 
    return this.joinedRoomRepository.save(joinedRoom);
  }

  async findByUser(user: UserI): Promise<JoinedRoomI[]> {
    return this.joinedRoomRepository.find({ user });
  }

  async findByRoom(room: RoomI): Promise<JoinedRoomI[]> {
    return this.joinedRoomRepository.find({ room });
  }

  async deleteBySocketId(socketId: string) {
    return this.joinedRoomRepository.delete({ socketId });
  }

  async deleteAll() {
    await this.joinedRoomRepository
      .createQueryBuilder()
      .delete()
      .execute();
  }
}