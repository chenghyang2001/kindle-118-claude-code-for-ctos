import { LinkRepository } from "../interfaces";
import { ShortLink } from "../types";

export class InMemoryLinkRepository implements LinkRepository {
  private readonly byCode = new Map<string, ShortLink>();
  // 只記第一個指向該網址的代碼，供 AC-2.2「同網址回同代碼」使用
  private readonly byUrl = new Map<string, ShortLink>();

  findByCode(code: string): ShortLink | undefined {
    return this.byCode.get(code);
  }

  findByUrl(targetUrl: string): ShortLink | undefined {
    return this.byUrl.get(targetUrl);
  }

  save(link: ShortLink): void {
    this.byCode.set(link.code, link);
    if (!this.byUrl.has(link.targetUrl)) {
      this.byUrl.set(link.targetUrl, link);
    }
  }
}
