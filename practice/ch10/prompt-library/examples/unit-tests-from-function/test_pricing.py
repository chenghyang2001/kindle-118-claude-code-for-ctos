"""apply_discount 的單元測試。

只根據 pricing.py 的程式碼與 docstring 推論行為；
標註「待確認」的案例代表規格未明確，目前以實作現況為準，不代表正確預期。
"""

import math

import pytest

from pricing import apply_discount


# ---------- 正常案例 ----------

@pytest.mark.parametrize(
    "price_cents, rate, expected",
    [
        pytest.param(1000, 0.2, 800, id="rate_0.2_代表打八折"),
        pytest.param(1000, 0.5, 500, id="半價"),
        pytest.param(999, 0.1, 899, id="結果有小數時四捨五入_899.1→899"),
        pytest.param(999, 0.15, 849, id="結果有小數時四捨五入_849.15→849"),
        pytest.param(1, 0.3, 1, id="最小正價格_0.7→1"),
        pytest.param(1000, 0.7, 300, id="浮點誤差_300.00000000000006仍回300"),
    ],
)
def test_正常折扣計算(price_cents, rate, expected):
    assert apply_discount(price_cents, rate) == expected


def test_回傳型別為int():
    assert type(apply_discount(999, 0.15)) is int


# ---------- 邊界值 ----------

@pytest.mark.parametrize(
    "price_cents, rate, expected",
    [
        pytest.param(0, 0.2, 0, id="價格為0_結果為0"),
        pytest.param(0, 0, 0, id="價格與折扣皆為0"),
        pytest.param(1000, 0, 1000, id="rate下限0_不打折"),
        pytest.param(1000, 0.0, 1000, id="rate下限0.0_float也接受"),
        pytest.param(1000, 1, 0, id="rate上限1_免費"),
        pytest.param(1000, 1.0, 0, id="rate上限1.0_float也接受"),
        pytest.param(10**12, 0.25, 750_000_000_000, id="大額價格正常計算"),
    ],
)
def test_邊界值(price_cents, rate, expected):
    assert apply_discount(price_cents, rate) == expected


# ---------- 錯誤輸入：price_cents ----------

@pytest.mark.parametrize(
    "price_cents",
    [
        pytest.param(-1, id="價格為負1"),
        pytest.param(-1000, id="價格為大負數"),
        pytest.param(100.0, id="價格為float即使是整數值"),
        pytest.param(99.5, id="價格為非整數float"),
        pytest.param("100", id="價格為字串"),
        pytest.param(None, id="價格為None空值"),
        pytest.param(True, id="價格為bool_True"),
        pytest.param(False, id="價格為bool_False"),
    ],
)
def test_無效價格拋ValueError(price_cents):
    with pytest.raises(ValueError):
        apply_discount(price_cents, 0.2)


# ---------- 錯誤輸入：rate 超出範圍 ----------

@pytest.mark.parametrize(
    "rate",
    [
        pytest.param(-0.01, id="rate略低於下限0"),
        pytest.param(-1, id="rate為負數"),
        pytest.param(1.01, id="rate略高於上限1"),
        pytest.param(20, id="rate誤用百分比20"),
        pytest.param(math.inf, id="rate為正無限大"),
        pytest.param(-math.inf, id="rate為負無限大"),
        pytest.param(math.nan, id="rate為NaN"),
    ],
)
def test_rate超出範圍拋ValueError(rate):
    with pytest.raises(ValueError):
        apply_discount(1000, rate)


def test_價格檢查優先於rate檢查():
    # 兩個參數都錯時，應回報價格的錯誤訊息
    with pytest.raises(ValueError, match="price_cents"):
        apply_discount(-1, 5)


# ---------- 待確認：規格未明確，以下斷言反映目前實作 ----------

@pytest.mark.parametrize(
    "rate",
    [
        pytest.param(None, id="待確認_rate為None空值拋TypeError而非ValueError"),
        pytest.param("0.2", id="待確認_rate為字串拋TypeError而非ValueError"),
    ],
)
def test_待確認_rate型別錯誤拋TypeError(rate):
    # 待確認：docstring 只說「rate 必須介於 0 到 1，否則拋 ValueError」，
    # 但實作沒有型別檢查，None / 字串比較時會由 Python 拋 TypeError。
    with pytest.raises(TypeError):
        apply_discount(1000, rate)


@pytest.mark.parametrize(
    "price_cents, rate, expected",
    [
        pytest.param(5, 0.5, 2, id="待確認_2.5銀行家捨入為2而非四捨五入3"),
        pytest.param(15, 0.5, 8, id="待確認_7.5銀行家捨入為8"),
        pytest.param(1, 0.5, 0, id="待確認_0.5銀行家捨入為0而非1"),
    ],
)
def test_待確認_剛好點五的捨入方式(price_cents, rate, expected):
    # 待確認：docstring 寫「四捨五入」，但 Python round() 是銀行家捨入（round half to even），
    # 剛好 .5 時結果與傳統四捨五入不同。
    assert apply_discount(price_cents, rate) == expected


def test_待確認_rate為bool_True被當成1():
    # 待確認：price_cents 明確拒絕 bool，但 rate 沒有，True 會被當成 1（免費）。
    assert apply_discount(1000, True) == 0


def test_待確認_超大價格轉float溢位拋OverflowError():
    # 待確認：price_cents 無上限，但乘以 float 時超過 float 範圍會拋 OverflowError。
    with pytest.raises(OverflowError):
        apply_discount(10**400, 0.5)
