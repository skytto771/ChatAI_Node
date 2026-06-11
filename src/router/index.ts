import express from 'express';
import userRouter from './user'
import uploadRouter from './upload';
import verificationCodeRouter from './verification'
import conversationRouter from './conversation';
import messageRouter from './message';
import modelSettingsRouter from './modelSetting';

const router = express.Router();

router.use('/user', userRouter)
router.use('/upload',uploadRouter)
router.use('/verification',verificationCodeRouter)
router.use('/conversation',conversationRouter)
router.use('/message',messageRouter)
router.use('/modelSettings',modelSettingsRouter)

export default router