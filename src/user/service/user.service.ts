import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IPaginationOptions, paginate, Pagination } from "nestjs-typeorm-paginate";
import { AuthService } from "src/auth/auth.service";
import { Like, Repository } from "typeorm";
import { UserEntity } from "../user.entity";
import { UserI } from "../user.interface";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private authService: AuthService
  ) { }

  async create(newUser: UserI): Promise<UserI> {
    try {
      const exists: boolean = await this.mailExists(newUser.email);
      if (!exists) {
        const passwordHash: string = await this.hashPassword(newUser.password);
        newUser.password = passwordHash;
        const user = await this.userRepository.save(this.userRepository.create(newUser));
        return this.findOne(user.id);
      } else {
        throw new HttpException('이미 사용중인 이메일입니다.', HttpStatus.CONFLICT);
      }
    } catch {
      throw new HttpException('이미 사용중인 이메일입니다.', HttpStatus.CONFLICT);
    }
  }

  async login(user: UserI): Promise<string> {
    try {
      const foundUser: UserI = await this.findByEmail(user.email.toLowerCase());
      if (foundUser) {
        const matches: boolean = await this.validatePassword(user.password, foundUser.password);
        if (matches) {
          const payload: UserI = await this.findOne(foundUser.id);
          return this.authService.generateJwt(payload);
        } else {
          throw new HttpException('로그인 실패', HttpStatus.UNAUTHORIZED);
        }
      } else {
        throw new HttpException('로그인 실패', HttpStatus.UNAUTHORIZED);
      }
    } catch {
      throw new HttpException('등록되지 않은 유저', HttpStatus.NOT_FOUND);
    }
  }

  async findAll(options: IPaginationOptions): Promise<Pagination<UserI>> {
    return paginate<UserEntity>(this.userRepository, options);
  }

  async findAllByUsername(username: string): Promise<UserI[]> {
    return this.userRepository.find({
      where: {
        username: Like(`%${username.toLowerCase()}%`)
      }
    })
  }

  private async findByEmail(email: string): Promise<UserI> {
    return this.userRepository.findOne({ email }, { select: ['id', 'email', 'username', 'password'] });
  }

  private async hashPassword(password: string): Promise<string> {
    return this.authService.hashPassword(password);
  }

  private async validatePassword(password: string, storedPasswordHash: string): Promise<any> {
    return this.authService.comparePasswords(password, storedPasswordHash);
  }

  private async findOne(id: number): Promise<UserI> {
    return this.userRepository.findOne({ id });
  }

  public getOne(id: number): Promise<UserI> {
    return this.userRepository.findOneOrFail({ id });
  }

  private async mailExists(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ email });
    if (user) {
      return true;
    } else {
      return false;
    }
  }
}