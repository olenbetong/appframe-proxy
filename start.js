import { startServer } from "./index.js";
import { config } from "dotenv";

config();

startServer({
  hostname: "dev.obet.no",
  password: process.env.APPFRAME_PWD,
  username: process.env.APPFRAME_LOGIN,
});
