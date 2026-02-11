import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const user = new this.userModel(createUserDto);
      await user.save();

      this.logger.log(`User created: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error creating user: ${createUserDto.email}`, error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, isActive: true }).exec();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.sanitizeUser(user) : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, { lastLoginAt: new Date() })
      .exec();
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find({ isActive: true }).exec();
    return users.map((user) => this.sanitizeUser(user));
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: UserDocument): User {
    const userObject = user.toObject();
    delete userObject.password;
    return userObject as User;
  }
}
