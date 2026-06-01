// controllers/userController.js
import { createToken } from "../util/jwt";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { File, FileChunk } from "../models";
import { Request, Response } from "express";
import { FileAttributes } from "../models/File";
import { FileChunkAttributes } from "../models/FileChunk";

const generateFileName = (originName:string) => {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const ext = path.extname(originName);

  return `${timestamp}_${uuid}${ext}`;
};

export const uploadSmall = async (req:Request, res:Response) => {
  try {
    const {
      originalName,
      fileName,
      mimeType,
      fileSize,
      fileHash,
      fileUrl,
      sourcePath,
      finalPath,
      finalDir,
    } = req.uploadedFile!;
    const userId = req.user!.id;

    const existFile = await File.findOne({
      where: {
        userId,
        fileHash,
      },
    });

    if(existFile) return

    await fs.mkdirSync(finalDir, { recursive: true });
    fs.rename(sourcePath, finalPath, async (err) => {});

    const file = await File.create({
      userId,
      fileHash,
      fileName,
      originalName,
      fileSize,
      mimeType,
      fileUrl,
      filePath: finalPath,
      status: "completed",
    });

    res.send({
      success: true,
      uploaded: true,
      message: "上传成功",
      data: file.toJSON(),
    });
  } catch (err) {
    console.error(err);
  }
};

export const uploadInit = async (req:Request, res:Response) => {
  try {
    const { fileHash, originalName, fileSize, mimeType } = req.body;
    const userId = req.user!.id;

    if (!fileHash || !originalName || !fileSize || !mimeType) {
      return res.status(400).json({
        success: false,
        message: "文件哈希值、文件原始名、文件大小、文件类型缺失",
      });
    }

    const count = await File.count();

    const existFile = await File.findOneSafe({
      where: {
        fileHash,
        userId,
      },
    });

    if (existFile) {
      if (existFile.status == "completed") {
        const uploadedChunks = await existFile.getFileChunks();
        return res.send({
          success: true,
          uploaded: true,
          message: "文件已存在",
          data: existFile.toJSON(),
          uploadedChunks,
        });
      } else if (
        existFile.status == "pending" ||
        existFile.status == "uploading"
      ) {
        const uploadedChunks = await existFile.getFileChunks();
        return res.send({
          success: true,
          uploaded: false,
          message: "文件正在上传",
          data: existFile.toJSON(),
          uploadedChunks,
        });
      }
    }

    const fileName = generateFileName(originalName);
    const file = await File.create({
      userId: userId,
      fileHash,
      fileName,
      originalName,
      fileSize,
      mimeType,
      status: "uploading",
    });

    res.send({
      success: true,
      uploaded: false,
      message: "初始化成功",
      data: file.toJSON(),
      uploadedChunks: [],
    });
  } catch (err) {
    console.log(err);
  }
};

export const uploadChunk = async (req:Request, res:Response) => {
  try {
    const { chunkSize, chunkPath, chunkIndex, fileId } = req.uploadedChunk!;

    const file = await File.findOne({
      where: {
        id: fileId,
      },
    });

    const existChunk = await FileChunk.findOne({
      where: {
        chunkIndex,
        fileId,
      },
    });

    const chunks = await FileChunk.findAll({
      where: {
        fileId,
      },
    });
    const uploadedCount = chunks.length + 1;

    if (!file) {
      return res.status(500).json({
        message: "文件信息缺失",
      });
    }

    if (existChunk) {
      return res.send({
        success: true,
        data: existChunk.toJSON(),
        uploadedChunkCounts: uploadedCount,
      });
    }

    const fileChunk = await FileChunk.create({
      fileId,
      chunkPath,
      chunkIndex,
      chunkSize,
    });

    res.send({
      success: true,
      data: fileChunk.toJSON(),
      uploadedChunkCounts: uploadedCount,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const uploadComplete = async (req:Request, res:Response) => {
  try {
    const { fileId, fileHash, chunkCount } = req.body;

    const file = await File.findOne({
      where: {
        id: fileId,
      },
    });
    if (!file) {
      return res.status(500).json({
        message: "文件信息缺失",
      });
    }

    const chunks = await FileChunk.findAll({
      where: {
        fileId,
      },
    });
    if (chunks.length !== chunkCount) {
      return res.status(400).json({ message: "分片不完整" });
    }

    const back = await mergeChunks(file, chunks, file.fileName);

    const updateData:any = {};

    if (back.success) {
      const fileUrl = `${req.protocol}://${req.get("host")}` + back.backPath;
      updateData.fileUrl = fileUrl;
      updateData.status = "completed";
      updateData.filePath = back.filePath;
    } else {
      return res.status(500).json({
        success: false,
        message: "发生错误，请重试",
        error: back.err,
      });
    }

    // 上传文件url、修改状态
    await file.update(updateData);

    // 删除分片数据、内存
    chunks.forEach((item:any) => {
      // 删除分片
      fs.unlinkSync(item.chunkPath);
      FileChunk.destroy({
        where: {
          id: item.id,
        },
      });
    });

    res.send({
      success: true,
      data: {
        file: file.toJSON(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err,
    });
  }
};

// 辅助方法，合并文件
const mergeChunks = async (file: FileAttributes, chunks: FileChunkAttributes[], fileName:string) => {
  try {
    // 按日期设定存储路径
    const date = new Date();
    const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    let finalDir = "";
    let backDir = "";

    if (file.mimeType.startsWith("image/")) {
      backDir = "/images";
      finalDir = path.join(__dirname, "..", "/uploads/files/images", yearMonth);
    } else if (file.mimeType.startsWith("video/")) {
      backDir = "/videos";
      finalDir = path.join(__dirname, "..", "/uploads/files/videos", yearMonth);
    } else {
      backDir = "/others";
      finalDir = path.join(__dirname, "..", "/uploads/files/others", yearMonth);
    }
    await fs.mkdirSync(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, fileName);
    const writeStream = await fs.createWriteStream(finalPath);

    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = chunks[i].chunkPath;

      await waitForFile(chunkPath);

      const readStream = fs.createReadStream(chunkPath);
      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream, { end: false }); //不自动结束
        readStream.on("end", resolve);
        readStream.on("error", reject);
      });
    }

    writeStream.end();

    await new Promise((resolve) => writeStream.on("finish", resolve));

    const actualMD5 = await calculateFileMD5(finalPath);

    if (actualMD5 && actualMD5 !== file.fileHash) {
      fs.unlinkSync(finalPath);
      return {
        success: false,
        message: "文件验证失败",
      };
    }

    return {
      success: true,
      backPath: path.join(backDir, yearMonth, fileName),
      filePath: finalPath,
    };
  } catch (err) {
    return { success: false, err };
  }
};

// 辅助方法，等待文件出现（避免并发问题）
const waitForFile = (filePath:string, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(check);
        resolve('success');
      } else if (Date.now() - start > timeout) {
        clearInterval(check);
        reject(
          new Error(
            JSON.stringify({
              err: `文件超时: ${filePath}`,
              status: "fileEmpty",
            }),
          ),
        );
      }
    }, 100);
  });
};

// 辅助方法，计算文件md5
async function calculateFileMD5(filePath:string) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export const uploadCancel = async (req:Request, res:Response) => {
  const { fileId } = req.body;

  if (!fileId)
    return res.status(403).json({ success: false, message: "文件id缺失" });

  try {
    const file = await File.findOne({
      where: {
        id: fileId,
      },
    });

    if(!file) return

    if (file.fileUrl) {
      const urlObj = new URL(file.fileUrl);
      const filePath = path.join(
        __dirname,
        "..",
        "/uploads/files",
        urlObj.pathname,
      );

      // 检查并删除物理文件
      const stats = await fs.statSync(filePath);
      if (stats.isFile()) {
        await fs.unlinkSync(filePath);
      }

      await file.destroy();
    }
    // 已级联删除，此用于检验清理残留
    const chunkCount = await FileChunk.count({
      where: { fileId },
    });

    if (chunkCount > 0) {
      await FileChunk.destroy({
        where: {
          fileId,
        },
      });
    }

    res.send({
      success: true,
      message: `文件${fileId}已移除`,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err,
    });
  }
};

export const getFileUrl = async (req:Request, res:Response) => {
  const fileId = req.params.id;
  if (!fileId) {
    return res.status(404).json({
      success: false,
      message: "该文件不存在或请求参数有误",
    });
  }

  try {
    const file = await File.findOneSafe({
      where: {
        id: fileId,
      },
    });
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "该文件不存在或请求参数有误",
      });
    }

    res.send({
      success: true,
      message: "成功获取文件url",
      fileUrl: file.fileUrl,
    });
  } catch (err) {
    console.error(err);
  }
};
