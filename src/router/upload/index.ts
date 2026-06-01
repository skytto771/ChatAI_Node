import express from "express"
import { uploadInit, uploadChunk, uploadComplete, uploadCancel, uploadSmall, getFileUrl } from "../../controller/uploadController"
import { authMiddleware } from "../../middleware/authMiddleware"
import {
  handleChunkUpload,
  handleSmallUpload
} from "../../middleware/uploadMiddleware"

const router = express.Router();

// 用户路由
// 所有参数都在 body 中，URL 不包含任何参数
router
  .post("/largeFileInit", authMiddleware, uploadInit)
  .post(
    "/chunk",
    authMiddleware,
    handleChunkUpload("chunk"),
    uploadChunk,
  )
  .post("/mergeComplete", authMiddleware, uploadComplete)
  .post("/cancelUpload", authMiddleware, uploadCancel)
  .get("/getFileUrl/:id", authMiddleware, getFileUrl)
  .post(
    "/uploadSmall",
    authMiddleware,
    handleSmallUpload("file"),
    uploadSmall,
  );

export default router;
