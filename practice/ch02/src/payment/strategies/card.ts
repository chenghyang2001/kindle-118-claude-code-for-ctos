import { ProviderError, ValidationError } from "../../lib/errors";
import type { PaymentRequest, PaymentResult, PaymentStrategy } from "../types";

export const cardStrategy: PaymentStrategy = {
  method: "card",

  calculateFee(amount: number): number {
    // 假設值：刷卡 2.9% + 30 分
    return Math.round(amount * 0.029) + 30;
  },

  process(req: PaymentRequest): PaymentResult {
    const digits = (req.cardNumber ?? "").replace(/\s+/g, "");
    if (!/^\d{16}$/.test(digits)) {
      throw new ValidationError("cardNumber", "卡號必須是 16 位數字");
    }
    // 模擬發卡行拒絕：卡號以 0000 結尾
    if (digits.endsWith("0000")) {
      throw new ProviderError("PROVIDER_DECLINED", "發卡行拒絕交易");
    }
    return {
      status: "approved",
      method: this.method,
      amount: req.amount,
      fee: this.calculateFee(req.amount),
      reference: `CARD-${digits.slice(-4)}`,
    };
  },
};
