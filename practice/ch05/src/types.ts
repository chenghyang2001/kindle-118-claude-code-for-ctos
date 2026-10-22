/** 角色、權限與使用者型別 */

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "users:change-role";

// 角色→權限集中在這裡，路由只認權限字串，新增角色不必改路由
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  viewer: ["users:read"],
  editor: ["users:read", "users:create", "users:update"],
  admin: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "users:change-role",
  ],
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}
