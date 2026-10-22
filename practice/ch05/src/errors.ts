/** 帶 HTTP 狀態碼的錯誤，交給集中錯誤中介層轉成回應 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
