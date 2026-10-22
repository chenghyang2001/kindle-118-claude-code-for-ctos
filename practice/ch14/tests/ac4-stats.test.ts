import { NotFoundError } from "../src/errors";
import { FIXED_TIME, makeService } from "./helpers";

describe("AC-4 統計", () => {
  it("AC-4.1 回傳點擊數與建立時間", () => {
    const service = makeService();
    const link = service.shorten("https://example.com/a");
    service.resolve(link.code);
    expect(service.stats(link.code)).toEqual({ code: link.code, hits: 1, createdAt: FIXED_TIME });
    expect(() => service.stats("nope00")).toThrow(NotFoundError);
  });

  it("AC-4.2 查詢統計不會增加點擊數", () => {
    const service = makeService();
    const link = service.shorten("https://example.com/a");
    service.stats(link.code);
    service.stats(link.code);
    expect(service.stats(link.code).hits).toBe(0);
  });
});
