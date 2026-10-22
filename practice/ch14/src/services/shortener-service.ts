import { randomInt } from "node:crypto";
import { AliasTakenError, NotFoundError } from "../errors";
import { Clock, CodeGenerator, LinkRepository } from "../interfaces";
import { LinkStats, ShortLink, ShortenOptions } from "../types";
import { validateAlias, validateUrl } from "../validation/url";

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const CODE_LENGTH = 6;
// 6 碼 base62 空間約 568 億，連撞 5 次幾乎不可能；真發生代表產生器壞了，直接報錯
const MAX_GENERATE_ATTEMPTS = 5;

export class Base62CodeGenerator implements CodeGenerator {
  next(): string {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i += 1) {
      code += BASE62[randomInt(BASE62.length)];
    }
    return code;
  }
}

export const systemClock: Clock = { now: () => new Date() };

export class ShortenerService {
  constructor(
    private readonly repo: LinkRepository,
    private readonly codes: CodeGenerator = new Base62CodeGenerator(),
    private readonly clock: Clock = systemClock,
  ) {}

  shorten(url: string, options: ShortenOptions = {}): ShortLink {
    const targetUrl = validateUrl(url);
    if (options.alias !== undefined) {
      return this.saveWithAlias(targetUrl, validateAlias(options.alias));
    }
    const existing = this.repo.findByUrl(targetUrl);
    if (existing !== undefined) {
      return existing;
    }
    return this.persist(targetUrl, this.generateUniqueCode());
  }

  resolve(code: string): string {
    const link = this.requireLink(code);
    link.hits += 1;
    // 回存一次：換成 Redis／Postgres 時點擊數才會落地（記憶體版是同一物件）
    this.repo.save(link);
    return link.targetUrl;
  }

  stats(code: string): LinkStats {
    const { hits, createdAt } = this.requireLink(code);
    return { code, hits, createdAt };
  }

  private requireLink(code: string): ShortLink {
    const link = this.repo.findByCode(code);
    if (link === undefined) {
      throw new NotFoundError(code);
    }
    return link;
  }

  private saveWithAlias(targetUrl: string, alias: string): ShortLink {
    if (this.repo.findByCode(alias) !== undefined) {
      throw new AliasTakenError(alias);
    }
    return this.persist(targetUrl, alias);
  }

  private generateUniqueCode(): string {
    for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt += 1) {
      const code = this.codes.next();
      if (this.repo.findByCode(code) === undefined) {
        return code;
      }
    }
    throw new Error(`連續 ${MAX_GENERATE_ATTEMPTS} 次產生重複代碼`);
  }

  private persist(targetUrl: string, code: string): ShortLink {
    const link: ShortLink = { code, targetUrl, createdAt: this.clock.now(), hits: 0 };
    this.repo.save(link);
    return link;
  }
}
