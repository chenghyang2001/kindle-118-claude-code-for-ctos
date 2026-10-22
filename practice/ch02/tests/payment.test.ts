// 只透過公開 API（src/index.ts）測試；重構後這份測試必須原封不動通過
import {
  processPayment,
  calculateFee,
  SUPPORTED_METHODS,
  ValidationError,
  ProviderError,
  UnsupportedMethodError,
  AppError,
} from "../src";

const base = { amount: 10000, currency: "TWD" };

function catchError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error("預期要丟出錯誤，但沒有");
}

describe("processPayment — 正常案例", () => {
  test("刷卡成功並帶手續費與參考碼", () => {
    const r = processPayment({
      ...base,
      method: "card",
      cardNumber: "4242 4242 4242 4242",
    });
    expect(r).toEqual({
      status: "approved",
      method: "card",
      amount: 10000,
      fee: 320,
      reference: "CARD-4242",
    });
  });
  test("PayPal 成功", () => {
    const r = processPayment({
      ...base,
      method: "paypal",
      paypalEmail: "amy@example.com",
    });
    expect(r).toMatchObject({
      method: "paypal",
      fee: 340,
      reference: "PP-AMY",
    });
  });
  test("銀行轉帳成功", () => {
    const r = processPayment({
      ...base,
      method: "bank_transfer",
      bankAccount: "1234567890",
    });
    expect(r).toMatchObject({
      method: "bank_transfer",
      fee: 1500,
      reference: "BT-7890",
    });
  });
});

describe("processPayment — 邊界與錯誤案例", () => {
  test.each([0, -1, 1.5, 1_000_000_01])("金額 %p 被拒", (amount) => {
    expect(() =>
      processPayment({
        ...base,
        amount,
        method: "card",
        cardNumber: "4242424242424242",
      }),
    ).toThrow(ValidationError);
  });
  test("幣別格式錯誤帶 field", () => {
    const err = catchError(() =>
      processPayment({
        ...base,
        currency: "twd",
        method: "card",
        cardNumber: "4242424242424242",
      }),
    );
    expect(err).toMatchObject({ code: "VALIDATION_FAILED", field: "currency" });
  });
  test("卡號格式錯誤帶 field", () => {
    const err = catchError(() =>
      processPayment({ ...base, method: "card", cardNumber: "123" }),
    );
    expect(err).toMatchObject({ field: "cardNumber" });
  });
  test("發卡行拒絕 → PROVIDER_DECLINED、不可重試", () => {
    const err = catchError(() =>
      processPayment({
        ...base,
        method: "card",
        cardNumber: "4242424242420000",
      }),
    );
    expect(err).toBeInstanceOf(ProviderError);
    expect(err).toMatchObject({ code: "PROVIDER_DECLINED", retryable: false });
  });
  test("PayPal 服務中斷 → 可重試", () => {
    const err = catchError(() =>
      processPayment({
        ...base,
        method: "paypal",
        paypalEmail: "x@down.example",
      }),
    );
    expect(err).toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  });
  test("銀行轉帳只收 TWD", () => {
    expect(() =>
      processPayment({
        amount: 100,
        currency: "USD",
        method: "bank_transfer",
        bankAccount: "1234567890",
      }),
    ).toThrow(ValidationError);
  });
  test("不支援的付款方式", () => {
    const err = catchError(() => processPayment({ ...base, method: "crypto" }));
    expect(err).toBeInstanceOf(UnsupportedMethodError);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ code: "UNSUPPORTED_METHOD" });
  });
});

describe("calculateFee 與 SUPPORTED_METHODS", () => {
  test("各方式手續費", () => {
    expect(calculateFee("card", 10000)).toBe(320);
    expect(calculateFee("paypal", 10000)).toBe(340);
    expect(calculateFee("bank_transfer", 10000)).toBe(1500);
  });
  test("未知方式丟 UnsupportedMethodError", () => {
    expect(() => calculateFee("cash", 100)).toThrow(UnsupportedMethodError);
  });
  test("支援清單順序固定", () => {
    expect(SUPPORTED_METHODS).toEqual(["card", "paypal", "bank_transfer"]);
  });
});
