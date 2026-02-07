export interface WsUser {
  id: string;
  email: string;
  role: string;
}

export interface WsJwtPayload {
  sub: string;
  email: string;
  role: string;
}
