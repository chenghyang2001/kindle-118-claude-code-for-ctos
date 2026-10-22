import { ShortLink } from "./types";

/** 儲存層介面（決策 D3：之後可換 Redis／Postgres） */
export interface LinkRepository {
  findByCode(code: string): ShortLink | undefined;
  findByUrl(targetUrl: string): ShortLink | undefined;
  save(link: ShortLink): void;
}

/** 代碼產生器（決策 D4：測試可注入固定序列） */
export interface CodeGenerator {
  next(): string;
}

/** 時鐘（決策 D4） */
export interface Clock {
  now(): Date;
}
