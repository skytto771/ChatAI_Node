import { cleanCode } from "./cleanVerifyCode";



export const intervalControl = {
    start: async function () {
        console.log('✅ 启用定时任务')
        await cleanCode()
    },
    stop: async function () {

    }
}