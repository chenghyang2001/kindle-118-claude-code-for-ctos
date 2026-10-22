import { Clock, CodeGenerator } from "../src/interfaces";
import { InMemoryLinkRepository } from "../src/repositories/in-memory-link-repository";
import { ShortenerService } from "../src/services/shortener-service";

/** 依序吐出固定代碼，讓測試可決定性（決策 D4） */
export class SequenceCodeGenerator implements CodeGenerator {
  private index = 0;
  constructor(private readonly codes: string[]) {}
  next(): string {
    const code = this.codes[this.index % this.codes.length];
    this.index += 1;
    return code;
  }
}

export const FIXED_TIME = new Date("2026-10-22T00:00:00.000Z");
export const fixedClock: Clock = { now: () => FIXED_TIME };

export function makeService(codes: string[] = ["abc123", "def456", "ghi789"]): ShortenerService {
  return new ShortenerService(new InMemoryLinkRepository(), new SequenceCodeGenerator(codes), fixedClock);
}
