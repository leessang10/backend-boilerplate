export class UserLoginEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}

export class UserLogoutEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}

export class RefreshTokenUsedEvent {
  constructor(
    public readonly userId: string,
    public readonly tokenId: string,
  ) {}
}
