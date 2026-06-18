import schedule from 'node-schedule'

import { cleanExpiredCodes } from '@/controller/VerificationController'


export async function cleanCode(){
    schedule.scheduleJob('0 0 0 * * *', async ()=>{
        try{
            console.log('清理过期验证码...')
            await cleanExpiredCodes()
            console.log('✅ 清理完成')
        }catch(err){
            console.log('❌ 清理失败 ',err)
        }
        
    })
}