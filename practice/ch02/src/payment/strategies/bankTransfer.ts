import { ValidationError } from "../../lib/errors";
import type { PaymentRequest, PaymentResult, PaymentStrategy } from "../types";

export const bankTransferStrategy: PaymentStrategy = {
  method: "bank_transfer",

  calculateFee(_amount: number): number {
    // 假設值：轉帳固定 15 元
    return 1500;
  },

  process(req: PaymentRequest): PaymentResult {
    const account = req.bankAccount ?? "";
    if (!/^\d{10,14}$/.test(account)) {
      throw new ValidationError("bankAccount", "帳號必須是 10～14 位數字");
    }
    if (req.currency !== "TWD") {
      throw new ValidationError("currency", "銀行轉帳只支援 TWD");
    }
    return {
      status: "approved",
      method: this.method,
      amount: req.amount,
      fee: this.calculateFee(req.amount),
      reference: `BT-${account.slice(-4)}`,
    };
  },
};
