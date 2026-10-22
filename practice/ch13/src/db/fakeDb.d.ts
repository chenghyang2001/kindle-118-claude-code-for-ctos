// fakeDb.js 的型別宣告：fakeDb.js 本身維持原樣（舊 callback driver 介面），
// tsc 解析 require('./fakeDb') 時會優先採用這份 .d.ts，不會對 fakeDb.js 做 checkJs。
import type { User, NewUser } from "../api/users/users.types";

// 出錯時 driver 只傳 err，此時 result 不會被讀取
type Callback<T> = (err: Error | null, result: T) => void;

export function findAllUsers(cb: Callback<User[]>): void;
export function findUserById(id: number, cb: Callback<User | null>): void;
export function insertUser(data: NewUser, cb: Callback<User>): void;
export function reset(): void;
export function __failNextQuery(): void;
