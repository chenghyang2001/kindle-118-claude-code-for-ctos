# API 文件

本文件列出 `src/` 下各模組匯出的函式。專案採用 CommonJS（`require`）。

## 目錄

- [src/calc.js（數學運算）](#srccalcjs數學運算)
  - [add(a, b)](#adda-b)
  - [divide(a, b)](#dividea-b)
- [src/strings.js（字串工具）](#srcstringsjs字串工具)
  - [capitalize(text)](#capitalizetext)
  - [slugify(text)](#slugifytext)
- [src/index.js（統一匯出）](#srcindexjs統一匯出)

---

## src/calc.js（數學運算）

```js
const { add, divide } = require("./src/calc");
```

### add(a, b)

```ts
add(a: number, b: number): number
```

回傳 `a + b`。

- 不檢查參數型別，也不會拋錯。
- 直接使用 JavaScript 的 `+` 運算子，所以只要有一個參數是字串，就會變成字串串接，而不是數字相加（見範例）。
- 浮點數運算有一般 JavaScript 的精度誤差。

```js
add(2, 3);     // 5
add(-1, 1);    // 0
add(0.1, 0.2); // 0.30000000000000004
add("2", 3);   // "23"（字串串接，不是 5）
```

### divide(a, b)

```ts
divide(a: number, b: number): number
```

回傳 `a / b`。

- **錯誤行為**：`b === 0` 時拋出 `Error`，訊息為 `"除數不可為 0"`。`-0 === 0` 也成立，所以 `divide(x, -0)` 同樣會拋錯。
- 只用嚴格相等（`===`）判斷 0，不檢查型別：字串 `"0"` 不會觸發錯誤，而是依 JavaScript 規則運算，`1 / "0"` 得到 `Infinity`。除數是 `NaN` 時也不會拋錯，結果是 `NaN`。

```js
divide(6, 3); // 2
divide(7, 2); // 3.5
divide(0, 5); // 0

try {
  divide(1, 0);
} catch (err) {
  console.log(err.message); // "除數不可為 0"
}

divide(1, "0"); // Infinity（字串 "0" 不會觸發檢查）
```

---

## src/strings.js（字串工具）

```js
const { capitalize, slugify } = require("./src/strings");
```

### capitalize(text)

```ts
capitalize(text: string): string
```

把字串的第一個字元轉成大寫，其餘不變。

- 不會拋錯。`text` 不是字串（如 `null`、`undefined`、數字）或是空字串時，回傳 `""`。
- 只轉換第一個字元，其餘字元保持原樣，不會被轉成小寫。

```js
capitalize("hello");       // "Hello"
capitalize("hELLO world"); // "HELLO world"
capitalize("");            // ""
capitalize(42);            // ""（非字串）
capitalize(null);          // ""
```

### slugify(text)

```ts
slugify(text: any): string
```

把輸入轉成適合放在網址中的片段（slug）。處理步驟：

1. `null` / `undefined` 視為 `""`，其他值用 `String()` 轉成字串
2. 去除前後空白
3. 全部轉成小寫
4. 把連續一個以上「非 `a-z`、`0-9`」的字元換成單一個 `-`
5. 去除開頭與結尾的 `-`

- 不會拋錯。
- 只保留 ASCII 英文字母與數字。中文、帶重音的字母（如 `é`）等字元都會被當成分隔符號處理，所以純中文輸入會得到 `""`。

```js
slugify(" Hello World! ");   // "hello-world"
slugify("Node.js 入門 101"); // "node-js-101"
slugify("--Foo__Bar--");     // "foo-bar"
slugify("Café");             // "caf"（é 被移除）
slugify("中文");              // ""
slugify(123);                // "123"
slugify(null);               // ""
```

---

## src/index.js（統一匯出）

本身沒有定義新函式，只把 `calc.js` 和 `strings.js` 的所有匯出合併後再匯出。兩個模組之間沒有同名函式，所以不會互相覆蓋。

| 匯出名稱 | 來源 |
| --- | --- |
| `add` | `src/calc.js` |
| `divide` | `src/calc.js` |
| `capitalize` | `src/strings.js` |
| `slugify` | `src/strings.js` |

```js
const { add, divide, capitalize, slugify } = require("./src");

add(1, 2);              // 3
divide(9, 3);           // 3
capitalize("node");     // "Node"
slugify("Hello World"); // "hello-world"
```
