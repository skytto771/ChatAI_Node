// controllers/uploadController.ts
import { Request, Response } from "express";
import { FileService } from "@/services/Files/FileService";
import { FileStorageService } from "@/services/Files/FileStorageService";
import { FileCleanupService } from "@/services/Files/FileCleanupService";
import path from "path";
import fs from "fs";

export const uploadSmall = async (req: Request, res: Response) => {
    try {
        const {
            originalName,
            fileName,
            mimeType,
            fileSize,
            fileHash,
            sourcePath,
            finalPath,
            finalDir,
        } = req.uploadedFile!;
        const userId = req.user!.id;

        const existFile = await FileService.findExistingFile(userId, fileHash);
        if (existFile) {
            return res.send({
                success: true,
                uploaded: true,
                message: "文件已存在",
                data: existFile.toJSON(),
            });
        }

        FileStorageService.ensureDirectoryExists(finalDir);
        await FileStorageService.moveTempFile(sourcePath, finalPath);

        const file = await FileService.createFileRecord(
            userId, fileHash, originalName, fileSize, mimeType, "completed"
        );

        res.send({
            success: true,
            uploaded: true,
            message: "上传成功",
            data: file.toJSON(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
};

export const uploadInit = async (req: Request, res: Response) => {
    try {
        const { fileHash, originalName, fileSize, mimeType } = req.body || {};
        const userId = req.user!.id;

        if (!fileHash || !originalName || !fileSize || !mimeType) {
            return res.status(400).json({
                success: false,
                message: "文件哈希值、文件原始名、文件大小、文件类型缺失",
            });
        }

        const existFile = await FileService.findExistingFile(userId, fileHash);
        if (existFile) {
            const uploadStatus = await FileService.getUploadStatus(existFile.id);
            return res.send({
                success: true,
                uploaded: uploadStatus.isCompleted,
                message: uploadStatus.isCompleted ? "文件已存在" : "文件正在上传",
                data: uploadStatus.file,
                uploadedChunks: uploadStatus.uploadedChunks,
            });
        }

        const file = await FileService.createFileRecord(
            userId, fileHash, originalName, fileSize, mimeType, "uploading"
        );

        res.send({
            success: true,
            uploaded: false,
            message: "初始化成功",
            data: file.toJSON(),
            uploadedChunks: [],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
};

export const uploadChunk = async (req: Request, res: Response) => {
    try {
        const { chunkSize, chunkPath, chunkIndex, fileId } = req.uploadedChunk!;

        const existChunk = await FileService.findExistingChunk(fileId, chunkIndex);
        const uploadedCount = (await FileService.getFileChunks(fileId)).length + 1;

        if (existChunk) {
            return res.send({
                success: true,
                data: existChunk.toJSON(),
                uploadedChunkCounts: uploadedCount,
            });
        }

        const fileChunk = await FileService.saveChunk(fileId, chunkIndex, chunkPath, chunkSize);

        res.send({
            success: true,
            data: fileChunk.toJSON(),
            uploadedChunkCounts: uploadedCount,
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

export const uploadComplete = async (req: Request, res: Response) => {
    try {
        const { fileId, chunkCount } = req.body || {};

        const isComplete = await FileService.checkChunksComplete(fileId, chunkCount);
        if (!isComplete) {
            return res.status(400).json({ message: "分片不完整" });
        }

        const file = await FileService.getUploadStatus(fileId);
        if (!file) {
            return res.status(500).json({ message: "文件信息缺失" });
        }

        const chunks = await FileService.getFileChunks(fileId);
        const { finalDir, backDir, yearMonth } = FileStorageService.getStoragePath(file.file.mimeType);
        
        FileStorageService.ensureDirectoryExists(finalDir);
        const finalPath = path.join(finalDir, file.file.fileName);
        
        await FileStorageService.mergeChunks(chunks, finalPath);
        
        const isValid = await FileStorageService.verifyFileIntegrity(finalPath, file.file.fileHash);
        if (!isValid) {
            fs.unlinkSync(finalPath);
            return res.status(500).json({ success: false, message: "文件验证失败" });
        }

        const fileUrl = `${req.protocol}://${req.get("host")}${path.join(backDir, yearMonth, file.file.fileName)}`;
        await FileService.completeFile(fileId, fileUrl, finalPath);

        // 清理分片
        for (const chunk of chunks) {
            fs.unlinkSync(chunk.chunkPath);
            await chunk.destroy();
        }

        res.send({
            success: true,
            data: { file: file.file },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
};

export const uploadCancel = async (req: Request, res: Response) => {
    const { fileId } = req.body || {};

    if (!fileId) {
        return res.status(403).json({ success: false, message: "文件id缺失" });
    }

    try {
        await FileCleanupService.deleteFileAndChunks(fileId);
        res.send({ success: true, message: `文件${fileId}已移除` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
};

export const getFileUrl = async (req: Request, res: Response) => {
    const { fileId } = req.body;
    if (!fileId) {
        return res.status(404).json({
            success: false,
            message: "该文件不存在或请求参数有误",
        });
    }

    try {
        const fileStatus = await FileService.getUploadStatus(fileId);
        if (!fileStatus) {
            return res.status(404).json({
                success: false,
                message: "该文件不存在或请求参数有误",
            });
        }

        res.send({
            success: true,
            message: "成功获取文件url",
            fileUrl: fileStatus.file.fileUrl,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err });
    }
};