import { ProviderError, ValidationError } from "../../lib/errors";
import type { PaymentRequest, PaymentResult, PaymentStrategy } from "../types";

export const paypalStrategy: PaymentStrategy = {
  method: "paypal",

  calculateFee(amount: number): number {
    // 假設值：PayPal 3.4%
    return Math.round(amount * 0.034);
  },

  process(req: PaymentRequest): PaymentResult {
    const email = req.paypalEmail ?? "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new ValidationError("paypalEmail", "PayPal 帳號必須是有效 email");
    }
    // 模擬服務中斷：特定網域
    if (email.endsWith("@down.example")) {
      throw new ProviderError("PROVIDER_UNAVAILABLE", "PayPal 服務暫時無法使用");
    }
    return {
      status: "approved",
      method: this.method,
      amount: req.amount,
      fee: this.calculateFee(req.amount),
      reference: `PP-${email.split("@")[0].toUpperCase()}`,
    };
  },
};
