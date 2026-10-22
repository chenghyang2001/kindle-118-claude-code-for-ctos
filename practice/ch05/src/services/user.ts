/** 使用者服務：記憶體內資料層（demo 用，不接資料庫） */
import { HttpError } from "../errors";
import { isRole, Role, User } from "../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CreateUserInput {
  name?: unknown;
  email?: unknown;
  role?: unknown;
}

export type UpdateUserInput = CreateUserInput;

export interface SeedUser extends User {
  token: string;
}

function validateName(name: unknown): string {
  if (typeof name !== "string" || name.trim() === "") {
    throw new HttpError(400, "name is required");
  }
  return name.trim();
}

function validateEmail(email: unknown): string {
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, "email is invalid");
  }
  return email.toLowerCase();
}

function validateRole(role: unknown): Role {
  if (!isRole(role)) {
    throw new HttpError(400, "role must be one of admin, editor, viewer");
  }
  return role;
}

export class UserService {
  private users: User[] = [];
  // demo 用靜態 token；正式環境應改用 JWT/OIDC，token 不可存明文
  private tokens = new Map<string, number>();
  private nextId = 1;

  constructor(seed: SeedUser[] = []) {
    for (const { token, ...user } of seed) {
      this.users.push({ ...user });
      this.tokens.set(token, user.id);
      this.nextId = Math.max(this.nextId, user.id + 1);
    }
  }

  list(): User[] {
    return this.users.map((u) => ({ ...u }));
  }

  get(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new HttpError(404, "user not found");
    return { ...user };
  }

  findByToken(token: string): User | undefined {
    const id = this.tokens.get(token);
    if (id === undefined) return undefined;
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : undefined;
  }

  create(input: CreateUserInput): User {
    const name = validateName(input.name);
    const email = validateEmail(input.email);
    const role = input.role === undefined ? "viewer" : validateRole(input.role);
    this.assertEmailUnique(email);
    const user: User = { id: this.nextId++, name, email, role };
    this.users.push(user);
    return { ...user };
  }

  update(id: number, input: UpdateUserInput): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new HttpError(404, "user not found");
    // 先全部驗證完才寫入，避免部分欄位成功、部分失敗
    const name =
      input.name === undefined ? user.name : validateName(input.name);
    const email =
      input.email === undefined ? user.email : validateEmail(input.email);
    const role =
      input.role === undefined ? user.role : validateRole(input.role);
    if (email !== user.email) this.assertEmailUnique(email);
    if (user.role === "admin" && role !== "admin") this.assertNotLastAdmin();
    Object.assign(user, { name, email, role });
    return { ...user };
  }

  remove(id: number): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new HttpError(404, "user not found");
    if (this.users[index].role === "admin") this.assertNotLastAdmin();
    this.users.splice(index, 1);
    for (const [token, userId] of this.tokens) {
      if (userId === id) this.tokens.delete(token);
    }
  }

  // 預審 high：降級或刪除後至少要留一位 admin，否則系統無人能管理
  private assertNotLastAdmin(): void {
    const adminCount = this.users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) {
      throw new HttpError(400, "cannot remove or demote the last admin");
    }
  }

  private assertEmailUnique(email: string): void {
    if (this.users.some((u) => u.email === email)) {
      throw new HttpError(409, "email already exists");
    }
  }
}
