import { Role } from '@prisma/client';

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly role: Role,
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly changes: Record<string, any>,
  ) {}
}

export class UserDeletedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class UserPasswordChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
