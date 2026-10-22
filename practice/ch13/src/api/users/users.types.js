// @ts-check
// users 模組的 JSDoc 型別（比照 orders.types.js）
// 注意：回應格式維持舊式（裸 JSON、錯誤 {error}），不是 JSend；改格式是另一張票。

/**
 * 資料層存的使用者。
 * 既有 bug（S1）：password 會原樣回傳給前端，型別如實反映現況。
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} [password]
 */

/**
 * 寫入資料層的新使用者（尚未有 id）
 * @typedef {Omit<User, 'id'>} NewUser
 */

/**
 * POST /api/users 的 request body；
 * 非 JSON content-type 時 express.json() 不會解析，body 可能是 undefined。
 * @typedef {Object} CreateUserBody
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [password]
 */

/**
 * 舊式錯誤回應
 * @typedef {Object} ErrorResponse
 * @property {string} error
 */

/**
 * GET /api/users/:id 的路由參數
 * @typedef {Object} UserIdParams
 * @property {string} id
 */

/** @typedef {Record<string, never>} NoParams */

/** @typedef {import('express').Request<NoParams, User[] | ErrorResponse>} ListUsersRequest */
/** @typedef {import('express').Response<User[] | ErrorResponse>} ListUsersResponse */

/** @typedef {import('express').Request<UserIdParams, User | ErrorResponse>} GetUserRequest */
/** @typedef {import('express').Response<User | ErrorResponse>} GetUserResponse */

/** @typedef {import('express').Request<NoParams, User | ErrorResponse, CreateUserBody | undefined>} CreateUserRequest */
/** @typedef {import('express').Response<User | ErrorResponse>} CreateUserResponse */

module.exports = {};
