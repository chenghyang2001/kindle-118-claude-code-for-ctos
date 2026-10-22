// 依 NODE_ENV 載入 config/environments/ 下的設定檔
const env = process.env.NODE_ENV || 'development';
// HACK(2023-11-02): test 環境沒有獨立設定檔，直接共用 development
const file = env === 'test' ? 'development' : env;
module.exports = require(`../config/environments/${file}`);
