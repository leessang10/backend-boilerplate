import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CryptoService } from '@shared/crypto/crypto.service';
import { CreateUserDto } from '../presentation/dto/create-user.dto';
import { UpdateUserDto } from '../presentation/dto/update-user.dto';
import { QueryUserDto } from '../presentation/dto/query-user.dto';
import { UserResponseDto } from '@domains/user';
import { PaginationMeta } from '@shared/interfaces/response.interface';
import {
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from '@domains/user';
import { UserRepository } from '../infrastructure/user.repository';
import { UserReaderPort } from '@domains/user';
import * as argon2 from 'argon2';

@Injectable()
export class UserService implements UserReaderPort {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly crypto: CryptoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await argon2.hash(createUserDto.password);

    // Encrypt phone if provided
    const encryptedPhone = createUserDto.phone
      ? this.crypto.encrypt(createUserDto.phone)
      : undefined;

    // Create user
    const user = await this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: encryptedPhone,
      role: createUserDto.role,
    });

    this.logger.log(`User created: ${user.id}`);

    // Emit user created event
    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(user.id, user.email, user.role),
    );

    return this.toResponseDto(user);
  }

  async findAll(
    query: QueryUserDto,
  ): Promise<{ data: UserResponseDto[]; meta: PaginationMeta }> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get total count
    const total = await this.userRepository.count(where);

    // Get users
    const users = await this.userRepository.findMany(where, skip, limit, {
      [sortBy]: sortOrder,
    });

    // Build pagination meta
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return {
      data: users.map((user) => this.toResponseDto(user)),
      meta,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(id);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Encrypt phone if provided
    const encryptedPhone = updateUserDto.phone
      ? this.crypto.encrypt(updateUserDto.phone)
      : undefined;

    // Update user
    const user = await this.userRepository.update(id, {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      phone: encryptedPhone,
      role: updateUserDto.role,
      isActive: updateUserDto.isActive,
    });

    this.logger.log(`User updated: ${user.id}`);

    // Emit user updated event
    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      updateUserDto as Record<string, unknown>,
    )) {
      if (value !== undefined) {
        changes[key] = value;
      }
    }

    this.eventEmitter.emit(
      'user.updated',
      new UserUpdatedEvent(user.id, user.email, changes),
    );

    return this.toResponseDto(user);
  }

  async remove(id: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user
    await this.userRepository.delete(id);

    this.logger.log(`User deleted: ${id}`);

    // Emit user deleted event
    this.eventEmitter.emit(
      'user.deleted',
      new UserDeletedEvent(user.id, user.email),
    );
  }

  /**
   * Convert user to response DTO (decrypt sensitive fields)
   */
  private toResponseDto(user: User): UserResponseDto {
    const dto = new UserResponseDto({
      ...user,
      phone: user.phone ? this.crypto.decrypt(user.phone) : undefined,
    });

    return dto;
  }
}
