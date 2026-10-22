// 服務健康狀態；放在 service 層讓路由只負責 HTTP，日後要加相依檢查（如 DB）也只改這裡
function getHealth() {
  return {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getHealth };
