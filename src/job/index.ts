import { cleanCode } from "./cleanVerifyCode";
import { cleanFiles } from "./cleanFiles";

export const intervalControl = {
  start: async function () {
    console.log("✅ 启用定时任务");
    await cleanCode();
    await cleanFiles();
  },
  stop: async function () {},
};
