/** 測試共用：每次產生全新的種子資料，避免測試間共享狀態 */
import { SeedUser, UserService } from "../src/services/user";

export const TOKENS = {
  admin: "t-admin",
  editor: "t-editor",
  viewer: "t-viewer",
} as const;

export function seedUsers(): SeedUser[] {
  return [
    {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      role: "admin",
      token: TOKENS.admin,
    },
    {
      id: 2,
      name: "Eddie",
      email: "eddie@example.com",
      role: "editor",
      token: TOKENS.editor,
    },
    {
      id: 3,
      name: "Vera",
      email: "vera@example.com",
      role: "viewer",
      token: TOKENS.viewer,
    },
  ];
}

export function newService(): UserService {
  return new UserService(seedUsers());
}

export const bearer = (token: string) => `Bearer ${token}`;
