// 字串工具模組
function capitalize(text) {
  if (typeof text !== "string" || text.length === 0) return "";
  return text[0].toUpperCase() + text.slice(1);
}

function slugify(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 超過 maxLength 時截斷並加上「…」，結果總長度不超過 maxLength
function truncate(text, maxLength) {
  if (maxLength < 1) throw new RangeError("maxLength 必須大於等於 1");
  const str = String(text ?? "");
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

module.exports = { capitalize, slugify, truncate };
