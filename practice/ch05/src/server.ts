/** 啟動入口：demo 用種子帳號，token 從環境變數讀取 */
import { createApp } from "./app";
import { UserService } from "./services/user";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`錯誤：缺少環境變數 ${key}`);
    process.exit(1);
  }
  return value;
}

const service = new UserService([
  {
    id: 1,
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    token: requireEnv("DEMO_ADMIN_TOKEN"),
  },
]);

const port = Number(process.env.PORT ?? 3000);
createApp(service).listen(port, () => {
  console.log(`伺服器啟動於 http://localhost:${port}`);
});
