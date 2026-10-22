/**
 * 付款模組共用型別（由 processor.ts 轉出為公開 API，策略實作也共用這裡的定義）
 */

export type PaymentMethod = "card" | "paypal" | "bank_transfer";

export interface PaymentRequest {
  method: string;
  amount: number; // 以「分」為單位的整數，避免浮點誤差
  currency: string;
  cardNumber?: string;
  paypalEmail?: string;
  bankAccount?: string;
}

export interface PaymentResult {
  status: "approved";
  method: PaymentMethod;
  amount: number;
  fee: number;
  reference: string;
}

/**
 * 付款策略：每種付款方式各自負責手續費計算、專屬欄位驗證與交易處理。
 * 錯誤一律丟 src/lib/errors.ts 的 AppError 子類別（ValidationError / ProviderError）。
 */
export interface PaymentStrategy {
  readonly method: PaymentMethod;
  calculateFee(amount: number): number;
  /** 前提：共用欄位（金額、幣別）已由 processor 驗證過 */
  process(req: PaymentRequest): PaymentResult;
}
