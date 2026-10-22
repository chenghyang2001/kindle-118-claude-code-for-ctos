// 啟動入口
const app = require("./app");
const config = require("./config");

app.listen(config.port, () => {
  console.log("legacy-shop-api listening on " + config.port);
});
