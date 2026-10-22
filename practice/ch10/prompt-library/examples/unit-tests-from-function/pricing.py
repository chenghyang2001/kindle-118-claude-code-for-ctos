"""示範用小函式：計算折扣後價格（K118 第 10 章提示詞庫實跑範例）。"""


def apply_discount(price_cents: int, rate: float) -> int:
    """回傳打折後的價格（單位：分），四捨五入到整數。

    - price_cents 必須是 >= 0 的整數，否則拋 ValueError。
    - rate 必須介於 0 到 1（含），否則拋 ValueError。
    - rate=0.2 代表打八折。
    """
    if isinstance(price_cents, bool) or not isinstance(price_cents, int):
        raise ValueError("price_cents 必須是整數")
    if price_cents < 0:
        raise ValueError("price_cents 不可為負數")
    if not 0 <= rate <= 1:
        raise ValueError("rate 必須介於 0 到 1")
    return round(price_cents * (1 - rate))
