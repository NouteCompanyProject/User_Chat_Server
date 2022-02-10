import { UserI } from "src/user/user.interface";
import { RoomEntity } from "./room.entity";

export interface MessageI {
    id?: number;
    text: string;
    user: UserI;
    room: RoomEntity;
    created_at: Date;
    updated_at: Date;
  }