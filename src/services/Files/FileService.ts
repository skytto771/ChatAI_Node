// services/FileService.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { File, FileChunk } from "@/models";
import { Op } from "sequelize";

type FileChunkInstance = InstanceType<typeof FileChunk>;

export class FileService {
    /**
     * 生成唯一文件名
     */
    static generateFileName(originName: string): string {
        const timestamp = Date.now();
        const uuid = crypto.randomUUID();
        const ext = path.extname(originName);
        return `${timestamp}_${uuid}${ext}`;
    }

    /**
     * 检查文件是否已存在
     */
    static async findExistingFile(userId: string, fileHash: string): Promise<any> {
        return await File.findOne({
            where: { userId, fileHash },
        });
    }

    /**
     * 获取文件上传状态
     */
    static async getUploadStatus(fileId: string): Promise<any> {
        const file = await File.findByPk(fileId);
        if (!file) return null;

        const chunks = await file.getFileChunks();
        return {
            file: file.toJSON(),
            uploadedChunks: chunks,
            isCompleted: file.status === "completed",
        };
    }

    /**
     * 创建新文件记录
     */
    static async createFileRecord(
        userId: string,
        fileHash: string,
        originalName: string,
        fileSize: number,
        mimeType: string,
        status: "uploading" | "pending" | "completed" = "uploading"
    ): Promise<any> {
        const fileName = this.generateFileName(originalName);
        return await File.create({
            userId,
            fileHash,
            fileName,
            originalName,
            fileSize,
            mimeType,
            status,
        });
    }

    /**
     * 更新文件完成状态
     */
    static async completeFile(fileId: number, fileUrl: string, filePath: string): Promise<void> {
        await File.update(
            {
                fileUrl,
                filePath,
                status: "completed",
            },
            { where: { id: fileId } }
        );
    }

    /**
     * 检查分片是否完整
     */
    static async checkChunksComplete(fileId: number, expectedChunkCount: number): Promise<boolean> {
        const chunkCount = await FileChunk.count({
            where: { fileId },
        });
        return chunkCount === expectedChunkCount;
    }

    /**
     * 获取文件所有分片
     */
    static async getFileChunks(fileId: string): Promise<FileChunkInstance[]> {
        return await FileChunk.findAll({
            where: { fileId },
            order: [["chunkIndex", "ASC"]],
        });
    }

    /**
     * 检查分片是否已存在
     */
    static async findExistingChunk(fileId: string, chunkIndex: number): Promise<any> {
        return await FileChunk.findOne({
            where: { fileId, chunkIndex },
        });
    }

    /**
     * 保存分片记录
     */
    static async saveChunk(
        fileId: string,
        chunkIndex: number,
        chunkPath: string,
        chunkSize: number
    ): Promise<any> {
        return await FileChunk.create({
            fileId,
            chunkIndex,
            chunkPath,
            chunkSize,
        });
    }

    /**
     * 删除文件及关联数据
     */
    static async deleteFile(fileId: number): Promise<void> {
        const file = await File.findByPk(fileId);
        if (!file) return;

        // 删除物理文件
        if (file.filePath && fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // 删除所有分片
        const chunks = await FileChunk.findAll({ where: { fileId } });
        for (const chunk of chunks) {
            if (fs.existsSync(chunk.chunkPath)) {
                fs.unlinkSync(chunk.chunkPath);
            }
            await chunk.destroy();
        }

        // 删除文件记录
        await file.destroy();
    }
}