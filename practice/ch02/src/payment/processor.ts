/**
 * 付款處理模組（strategy pattern 版本：各付款方式的邏輯在 ./strategies/ 下）
 * 公開 API：processPayment、calculateFee、SUPPORTED_METHODS、型別 PaymentRequest / PaymentResult / PaymentMethod
 */
import { ValidationError } from "../lib/errors";
import { getStrategy, STRATEGY_METHODS } from "./strategies";
import type { PaymentMethod, PaymentRequest, PaymentResult } from "./types";

export type { PaymentMethod, PaymentRequest, PaymentResult } from "./types";

export const SUPPORTED_METHODS: readonly PaymentMethod[] = STRATEGY_METHODS;

const MAX_AMOUNT = 1_000_000_00; // 假設值：單筆上限 100 萬元

function validateCommon(req: PaymentRequest): void {
  if (!Number.isInteger(req.amount) || req.amount <= 0) {
    throw new ValidationError("amount", "金額必須是正整數（單位：分）");
  }
  if (req.amount > MAX_AMOUNT) {
    throw new ValidationError("amount", "金額超過單筆上限");
  }
  if (!/^[A-Z]{3}$/.test(req.currency)) {
    throw new ValidationError("currency", "幣別必須是三碼大寫 ISO 代碼");
  }
}

export function calculateFee(method: string, amount: number): number {
  return getStrategy(method).calculateFee(amount);
}

export function processPayment(req: PaymentRequest): PaymentResult {
  // 維持原本順序：先驗共用欄位，再查付款方式（金額錯 + 方式不支援時仍回 ValidationError）
  validateCommon(req);
  return getStrategy(req.method).process(req);
}
