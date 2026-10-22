/** 一筆短網址紀錄 */
export interface ShortLink {
  code: string;
  targetUrl: string;
  createdAt: Date;
  hits: number;
}

/** 統計查詢結果（AC-4） */
export interface LinkStats {
  code: string;
  hits: number;
  createdAt: Date;
}

export interface ShortenOptions {
  /** 自訂別名，3～20 碼 [A-Za-z0-9-] */
  alias?: string;
}
