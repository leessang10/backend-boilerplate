import { User } from '@prisma/client';

export const USER_READER_PORT = Symbol('USER_READER_PORT');

export interface UserReaderPort {
  findByEmail(email: string): Promise<User | null>;
}
