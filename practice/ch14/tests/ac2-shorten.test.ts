import { AliasTakenError, InvalidAliasError } from "../src/errors";
import { InMemoryLinkRepository } from "../src/repositories/in-memory-link-repository";
import { Base62CodeGenerator, ShortenerService } from "../src/services/shortener-service";
import { makeService } from "./helpers";

describe("AC-2 縮短網址", () => {
  it("AC-2.1 預設產生 6 碼 base62 代碼", () => {
    const service = new ShortenerService(new InMemoryLinkRepository());
    const link = service.shorten("https://example.com/a");
    expect(link.code).toMatch(/^[0-9A-Za-z]{6}$/);
    expect(new Base62CodeGenerator().next()).toMatch(/^[0-9A-Za-z]{6}$/);
  });

  it("AC-2.2 同一網址縮短兩次回傳同一代碼", () => {
    const service = makeService();
    const first = service.shorten("https://example.com/a");
    const second = service.shorten("https://example.com/a");
    expect(second.code).toBe(first.code);
    expect(service.shorten("https://example.com/b").code).not.toBe(first.code);
  });

  it("AC-2.3 接受 3 到 20 碼的自訂別名", () => {
    const service = makeService();
    expect(service.shorten("https://example.com/a", { alias: "k118" }).code).toBe("k118");
    expect(service.shorten("https://example.com/b", { alias: "a-b" }).code).toBe("a-b");
    expect(service.shorten("https://example.com/c", { alias: "x".repeat(20) }).code).toBe("x".repeat(20));
  });

  it("AC-2.4 自訂別名已被使用時拋出 AliasTakenError", () => {
    const service = makeService();
    service.shorten("https://example.com/a", { alias: "k118" });
    expect(() => service.shorten("https://example.com/b", { alias: "k118" })).toThrow(AliasTakenError);
  });

  it("AC-2.5 自訂別名格式不符時拋出 InvalidAliasError", () => {
    const service = makeService();
    for (const bad of ["ab", "x".repeat(21), "有中文", "a b", "a/b"]) {
      expect(() => service.shorten("https://example.com/a", { alias: bad })).toThrow(InvalidAliasError);
    }
  });
});
