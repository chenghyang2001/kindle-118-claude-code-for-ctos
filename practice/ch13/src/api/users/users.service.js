// @ts-check
// users 商業邏輯（已遷移：async/await + JSDoc 型別）
const repo = require("../../db/usersRepo");

/** @typedef {import('./users.types').User} User */
/** @typedef {import('./users.types').CreateUserBody} CreateUserBody */

class ValidationError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/** @returns {Promise<User[]>} */
async function listUsers() {
  // FIXME(2024-03-15): 密碼雜湊也一起回傳給前端了，安全稽核要處理
  return repo.findAll();
}

/**
 * @param {number} id
 * @returns {Promise<User | null>}
 */
async function getUser(id) {
  return repo.findById(id);
}

/**
 * @param {CreateUserBody | undefined} data
 * @returns {Promise<User>}
 */
async function createUser(data) {
  // 驗證要在碰 DB 之前（表徵測試鎖住：驗證失敗不消耗 DB 失敗旗標）
  if (!data || !data.name || !data.email) {
    throw new ValidationError("name and email are required");
  }
  // TODO(2024-01-20): 檢查 email 是否重複
  return repo.insert({
    name: data.name,
    email: data.email,
    password: data.password,
  });
}

// 2022 年報表需求留下的 CSV 匯出，routes 早就不呼叫了（死碼，見 AUDIT_REPORT P12）
/**
 * @param {User[]} users
 * @returns {string}
 */
function legacyExportCsv(users) {
  const lines = ["id,name,email"];
  for (const u of users) {
    lines.push(u.id + "," + u.name + "," + u.email);
  }
  return lines.join("\n");
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  legacyExportCsv,
  ValidationError,
};
