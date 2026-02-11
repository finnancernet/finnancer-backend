import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService, CreateUserDto } from '../user/user.service';
import { User } from '../user/schemas/user.schema';

export interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<LoginResponse> {
    const user = await this.userService.create(createUserDto);
    return this.login(user);
  }

  async login(user: User): Promise<LoginResponse> {
    const payload = {
      sub: user['_id'].toString(),
      email: user.email,
    };

    await this.userService.updateLastLogin(user['_id'].toString());

    this.logger.log(`User logged in: ${user.email}`);

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    return this.userService.validateUser(email, password);
  }
}
