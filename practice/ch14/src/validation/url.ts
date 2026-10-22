import { InvalidAliasError, InvalidUrlError } from "../errors";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALIAS_PATTERN = /^[A-Za-z0-9-]{3,20}$/;

/** 驗證並正規化網址；只接受 http/https（擋掉 javascript: 等可被濫用的協定） */
export function validateUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed === "") {
    throw new InvalidUrlError("網址不可為空");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new InvalidUrlError(`無法解析的網址：${trimmed}`);
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new InvalidUrlError(`不支援的協定：${parsed.protocol}`);
  }
  return parsed.toString();
}

/** 別名只允許 3～20 碼英數與連字號（避免與路徑分隔、空白、非 ASCII 衝突） */
export function validateAlias(alias: string): string {
  if (!ALIAS_PATTERN.test(alias)) {
    throw new InvalidAliasError(`別名需為 3～20 碼英數或連字號：${alias}`);
  }
  return alias;
}
