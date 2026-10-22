import { NotFoundError } from "../src/errors";
import { makeService } from "./helpers";

describe("AC-3 解析短代碼", () => {
  it("AC-3.1 用代碼取回原始網址", () => {
    const service = makeService();
    const link = service.shorten("https://example.com/long/path?x=1");
    expect(service.resolve(link.code)).toBe("https://example.com/long/path?x=1");
  });

  it("AC-3.2 每次解析點擊數加一", () => {
    const service = makeService();
    const link = service.shorten("https://example.com/a");
    service.resolve(link.code);
    service.resolve(link.code);
    expect(link.hits).toBe(2);
  });

  it("AC-3.3 未知代碼拋出 NotFoundError", () => {
    const service = makeService();
    expect(() => service.resolve("nope00")).toThrow(NotFoundError);
  });
});
