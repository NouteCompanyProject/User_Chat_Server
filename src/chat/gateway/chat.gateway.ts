import { OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "src/auth/auth.service";
import { UserService } from "src/user/service/user.service";
import { UserI } from "src/user/user.interface";
import { ConnectedUserService } from "../connected-user.service";
import { ConnectedUserI } from "../entities/connected-user.interface";
import { JoinedRoomI } from "../entities/joined-room.interface";
import { MessageI } from "../entities/message.interface";
import { RoomI } from "../entities/room.interface";
import { JoinedRoomService } from "../joined-room.service";
import { MessageService } from "../message.service";
import { PageI } from "../page.interface.";
import { RoomService } from "../room.service";

@WebSocketGateway({ cors: { origin: ['https://hoppscotch.io', 'http://localhost:3000', 'http://localhost:4200'] } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private roomService: RoomService,
    private connectedUserService: ConnectedUserService,
    private joinedRoomService: JoinedRoomService,
    private messageService: MessageService) { }

  async onModuleInit() {
    await this.connectedUserService.deleteAll();
    await this.joinedRoomService.deleteAll();
  }

  async handleConnection(socket: Socket) {
    try {
      const decodedToken = await this.authService.verifyJwt(socket.handshake.headers.authorization);
      const user: UserI = await this.userService.getOne(decodedToken.user.id);
      if (!user) {
        return this.disconnect(socket);
      } else {
        socket.data.user = user;
        const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
        rooms.meta.currentPage = rooms.meta.currentPage - 1;
        await this.connectedUserService.create({ socketId: socket.id, user });
        return this.server.to(socket.id).emit('rooms', rooms);
      }
    } catch {
      return this.disconnect(socket);
    }
  }

  async handleDisconnect(socket: Socket) {
    await this.connectedUserService.deleteBySocketId(socket.id);
    socket.disconnect();
  }

  private disconnect(socket: Socket) {
    socket.emit('Error', new UnauthorizedException());
    socket.disconnect();
  }

  @SubscribeMessage('createRoom')
  async onCreateRoom(socket: Socket, room: RoomI) {
    const createdRoom: RoomI = await this.roomService.createRoom(room, socket.data.user);

    for (const user of createdRoom.users) {
      const connections: ConnectedUserI[] = await this.connectedUserService.findByUser(user);
      const rooms = await this.roomService.getRoomsForUser(user.id, { page: 1, limit: 10 });
      rooms.meta.currentPage = rooms.meta.currentPage - 1;
      for (const connection of connections) {
        await this.server.to(connection.socketId).emit('rooms', rooms);
      }
    }
  }

  @SubscribeMessage('paginateRooms')
  async onPaginateRoom(socket: Socket, page: PageI) {
    const rooms = await this.roomService.getRoomsForUser(socket.data.user.id, this.handleIncomingPageRequest(page));
    rooms.meta.currentPage = rooms.meta.currentPage - 1;
    return this.server.to(socket.id).emit('rooms', rooms);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(socket: Socket, room: RoomI) {
    const messages = await this.messageService.findMessagesForRoom(room, { limit: 10, page: 1 });
    messages.meta.currentPage = messages.meta.currentPage - 1;
    await this.joinedRoomService.create({ socketId: socket.id, user: socket.data.user, room });
    await this.server.to(socket.id).emit('messages', messages);
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(socket: Socket) {
    await this.joinedRoomService.deleteBySocketId(socket.id);
  }

  @SubscribeMessage('addMessage')
  async onAddMessage(socket: Socket, message: MessageI) {
    const createdMessage: MessageI = await this.messageService.create({...message, user: socket.data.user});
    const room: RoomI = await this.roomService.getRoom(createdMessage.room.id);
    const joinedUsers: JoinedRoomI[] = await this.joinedRoomService.findByRoom(room);
    for(const user of joinedUsers) {
      await this.server.to(user.socketId).emit('messageAdded', createdMessage);
    }
  }

  private handleIncomingPageRequest(page: PageI) {
    page.limit = page.limit > 100 ? 100 : page.limit;
    page.page = page.page + 1;
    return page;
  }
}