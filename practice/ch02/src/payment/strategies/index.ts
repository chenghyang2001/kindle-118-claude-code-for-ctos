/**
 * 策略註冊表：新增付款方式只需實作 PaymentStrategy 並加進下方陣列。
 * 陣列順序即 SUPPORTED_METHODS 的公開順序。
 */
import { UnsupportedMethodError } from "../../lib/errors";
import type { PaymentMethod, PaymentStrategy } from "../types";
import { bankTransferStrategy } from "./bankTransfer";
import { cardStrategy } from "./card";
import { paypalStrategy } from "./paypal";

const STRATEGIES: readonly PaymentStrategy[] = [
  cardStrategy,
  paypalStrategy,
  bankTransferStrategy,
];

// 用 Map 而非一般物件，避免 "constructor"、"toString" 等原型鏈鍵被誤判為支援的方式
const registry = new Map<string, PaymentStrategy>(
  STRATEGIES.map((s) => [s.method, s]),
);

export const STRATEGY_METHODS: readonly PaymentMethod[] = STRATEGIES.map(
  (s) => s.method,
);

export function getStrategy(method: string): PaymentStrategy {
  const strategy = registry.get(method);
  if (!strategy) {
    throw new UnsupportedMethodError(method);
  }
  return strategy;
}
