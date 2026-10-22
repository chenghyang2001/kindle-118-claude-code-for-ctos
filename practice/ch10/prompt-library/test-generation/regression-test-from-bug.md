# 依 bug 報告寫回歸測試

## 適用情境

- 收到 bug 報告，要先寫一個**會失敗**的測試重現問題，再修。
- 修完後確保同樣問題不會再出現。
- **不要用**：無法穩定重現的問題（時序、外部服務抖動），先找出重現條件再用。

## 變數

| 變數 | 說明 | 例 |
| --- | --- | --- |
| `{{BUG_REPORT}}` | bug 描述（輸入、預期、實際） | 「折扣 100% 時回傳負數」 |
| `{{SUSPECT_FILES}}` | 可疑檔案 | `src/pricing.py` |
| `{{FRAMEWORK}}` | 測試框架 | pytest |
| `{{TEST_FILE}}` | 測試檔 | `tests/test_pricing_regression.py` |

## 提示詞

```prompt
以下是 bug 報告：
{{BUG_REPORT}}

請：
1. 讀 {{SUSPECT_FILES}}，找出可能原因（先說明推論，不要改程式）。
2. 用 {{FRAMEWORK}} 在 {{TEST_FILE}} 寫一個最小的回歸測試重現問題，測試名稱包含 bug 摘要。
3. 執行測試，確認它在目前程式碼上**失敗**，貼出失敗訊息。
4. 停下來等我確認，不要自行修 bug。
```

## 範例

變數：`{{BUG_REPORT}}` = 「`apply_discount(1000, 1.5)` 應拋 ValueError，實際回傳 -500」

預期輸出重點：

- 推論：缺少折扣率上限檢查。
- 測試：`def test_discount_rate_above_one_raises(): with pytest.raises(ValueError): ...`
- 先跑一次顯示 FAILED。

## 維護資訊

- 負責人：＿＿＿
- 最後驗證：未實跑（範本）
