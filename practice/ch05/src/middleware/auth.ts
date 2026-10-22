/** 認證與授權中介層 */
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors";
import { UserService } from "../services/user";
import { Permission, ROLE_PERMISSIONS, Role, User } from "../types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** 解析 `Authorization: Bearer <token>`，成功則掛上 req.user，否則 401 */
export function authenticate(service: UserService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    const match =
      typeof header === "string" ? /^Bearer\s+(\S+)$/.exec(header) : null;
    if (!match) {
      next(new HttpError(401, "missing or malformed Authorization header"));
      return;
    }
    const user = service.findByToken(match[1]);
    if (!user) {
      next(new HttpError(401, "invalid token"));
      return;
    }
    req.user = user;
    next();
  };
}

/** 檢查 req.user 的角色是否具備指定權限，否則 403 */
export function authorize(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, "not authenticated"));
      return;
    }
    if (!hasPermission(req.user.role, permission)) {
      next(new HttpError(403, "forbidden"));
      return;
    }
    next();
  };
}
