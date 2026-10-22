import { InvalidUrlError } from "../src/errors";
import { validateUrl } from "../src/validation/url";

describe("AC-1 網址驗證", () => {
  it("AC-1.1 拒絕非 http/https 的網址並拋出 InvalidUrlError", () => {
    for (const bad of ["ftp://example.com", "javascript:alert(1)", "example.com", "http//x"]) {
      expect(() => validateUrl(bad)).toThrow(InvalidUrlError);
    }
  });

  it("AC-1.2 拒絕空字串並拋出 InvalidUrlError", () => {
    expect(() => validateUrl("")).toThrow(InvalidUrlError);
    expect(() => validateUrl("   ")).toThrow(InvalidUrlError);
  });

  it("AC-1.3 接受 http 與 https 網址", () => {
    expect(validateUrl("http://example.com")).toBe("http://example.com/");
    expect(validateUrl("  https://example.com/a?b=1  ")).toBe("https://example.com/a?b=1");
  });
});
