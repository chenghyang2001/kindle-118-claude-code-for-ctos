// Express app 組裝（不 listen，方便測試）
const express = require("express");

const app = express();
app.use(express.json());
app.use("/api/users", require("./api/users/users.routes"));
app.use("/api/orders", require("./api/orders/orders.routes"));

module.exports = app;
