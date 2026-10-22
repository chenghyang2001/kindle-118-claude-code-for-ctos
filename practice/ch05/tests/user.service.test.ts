/** UserService 單元測試 */
import { HttpError } from "../src/errors";
import { UserService } from "../src/services/user";
import { newService, TOKENS } from "./fixtures";

function statusOf(fn: () => unknown): number | undefined {
  try {
    fn();
  } catch (err) {
    if (err instanceof HttpError) return err.status;
    throw err;
  }
  return undefined;
}

describe("UserService", () => {
  let service: UserService;
  beforeEach(() => {
    service = newService();
  });

  it("list 回傳副本，外部修改不影響內部資料", () => {
    const users = service.list();
    users[0].role = "viewer";
    expect(service.get(1).role).toBe("admin");
  });

  it("create 預設角色 viewer、email 轉小寫、id 遞增", () => {
    const user = service.create({ name: " Bob ", email: "BOB@Example.com" });
    expect(user).toEqual({
      id: 4,
      name: "Bob",
      email: "bob@example.com",
      role: "viewer",
    });
  });

  it.each([
    [{ email: "x@y.io" }, 400],
    [{ name: "", email: "x@y.io" }, 400],
    [{ name: "X", email: "not-an-email" }, 400],
    [{ name: "X", email: "x@y.io", role: "Admin" }, 400],
    [{ name: "X", email: "ALICE@example.com" }, 409],
  ])("create 驗證 %p → %i", (input, status) => {
    expect(statusOf(() => service.create(input))).toBe(status);
  });

  it("update 驗證失敗時不留下部分修改", () => {
    expect(
      statusOf(() => service.update(2, { name: "New", role: "boss" })),
    ).toBe(400);
    expect(service.get(2).name).toBe("Eddie");
  });

  it("update 改成別人的 email → 409；改成自己的 → 成功", () => {
    expect(
      statusOf(() => service.update(2, { email: "vera@example.com" })),
    ).toBe(409);
    expect(service.update(2, { email: "EDDIE@example.com" }).email).toBe(
      "eddie@example.com",
    );
  });

  it("get／update／remove 不存在 → 404", () => {
    expect(statusOf(() => service.get(99))).toBe(404);
    expect(statusOf(() => service.update(99, {}))).toBe(404);
    expect(statusOf(() => service.remove(99))).toBe(404);
  });

  it("remove 後該使用者的 token 失效", () => {
    service.remove(3);
    expect(service.findByToken(TOKENS.viewer)).toBeUndefined();
  });
});
