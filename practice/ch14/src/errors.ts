// 自訂錯誤類別：呼叫端（未來的 HTTP 層）用 instanceof 對應 4xx（決策 D5）
export class InvalidUrlError extends Error {
  constructor(message = "網址格式不正確") {
    super(message);
    this.name = "InvalidUrlError";
  }
}

export class InvalidAliasError extends Error {
  constructor(message = "自訂別名格式不正確") {
    super(message);
    this.name = "InvalidAliasError";
  }
}

export class AliasTakenError extends Error {
  constructor(alias: string) {
    super(`自訂別名已被使用：${alias}`);
    this.name = "AliasTakenError";
  }
}

export class NotFoundError extends Error {
  constructor(code: string) {
    super(`找不到短代碼：${code}`);
    this.name = "NotFoundError";
  }
}
