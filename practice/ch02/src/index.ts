// 公開 API 入口：重構時這裡匯出的名稱與型別不可改變
export {
  processPayment,
  calculateFee,
  SUPPORTED_METHODS,
} from "./payment/processor";
export type {
  PaymentRequest,
  PaymentResult,
  PaymentMethod,
} from "./payment/processor";
export * from "./lib/errors";
