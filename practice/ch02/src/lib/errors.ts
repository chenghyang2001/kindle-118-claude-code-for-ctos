/**
 * 專案錯誤處理慣例（書上提示詞要求代理「Follow the error handling conventions in src/lib/errors.ts」）
 *
 * 慣例：
 * 1. 不丟裸 Error，一律丟 AppError 子類別，帶穩定的 `code`，呼叫端用 code 判斷而不是比對訊息字串。
 * 2. 輸入問題用 ValidationError（呼叫端可修正），外部服務失敗用 ProviderError（retryable 標示能否重試）。
 * 3. 包裝底層例外時保留 `cause`，方便追查根因。
 */

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNSUPPORTED_METHOD"
  | "PROVIDER_DECLINED"
  | "PROVIDER_UNAVAILABLE";

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class ValidationError extends AppError {
  readonly field: string;

  constructor(field: string, message: string) {
    super("VALIDATION_FAILED", message);
    this.field = field;
  }
}

export class UnsupportedMethodError extends AppError {
  constructor(method: string) {
    super("UNSUPPORTED_METHOD", `不支援的付款方式：${method}`);
  }
}

export class ProviderError extends AppError {
  readonly retryable: boolean;

  constructor(
    code: "PROVIDER_DECLINED" | "PROVIDER_UNAVAILABLE",
    message: string,
    options?: { cause?: unknown },
  ) {
    super(code, message, options);
    this.retryable = code === "PROVIDER_UNAVAILABLE";
  }
}

/** 邊界層使用：把未知例外統一轉成 AppError */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  return new ProviderError("PROVIDER_UNAVAILABLE", "未預期的付款服務錯誤", {
    cause: err,
  });
}
