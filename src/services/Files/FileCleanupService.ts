// services/FileCleanupService.ts
import fs from "fs";
import path from "path";
import { File, FileChunk } from "@/models";
import { Op } from "sequelize";

export class FileCleanupService {
    /**
     * 清理过期未完成的上传
     */
    static async cleanExpiredUploads(expiredHours: number = 24): Promise<number> {
        const expiredTime = new Date(Date.now() - expiredHours * 60 * 60 * 1000);
        
        const expiredFiles = await File.findAll({
            where: {
                status: { [Op.in]: ["uploading", "pending"] },
                createdAt: { [Op.lt]: expiredTime },
            },
        });

        let deletedCount = 0;
        for (const file of expiredFiles) {
            await this.deleteFileAndChunks(file.id);
            deletedCount++;
        }

        return deletedCount;
    }

    /**
     * 删除文件及所有关联分片
     */
    static async deleteFileAndChunks(fileId: string): Promise<void> {
        const file = await File.findByPk(fileId);
        if (!file) return;

        // 删除物理文件
        if (file.filePath && fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        // 删除分片
        const chunks = await FileChunk.findAll({ where: { fileId } });
        for (const chunk of chunks) {
            if (fs.existsSync(chunk.chunkPath)) {
                fs.unlinkSync(chunk.chunkPath);
            }
            await chunk.destroy();
        }

        await file.destroy();
    }

    /**
     * 清理孤立的分片（没有关联文件记录）
     */
    static async cleanOrphanChunks(): Promise<number> {
        const allChunks = await FileChunk.findAll();
        let deletedCount = 0;

        for (const chunk of allChunks) {
            const file = await File.findByPk(chunk.fileId);
            if (!file) {
                if (fs.existsSync(chunk.chunkPath)) {
                    fs.unlinkSync(chunk.chunkPath);
                }
                await chunk.destroy();
                deletedCount++;
            }
        }

        return deletedCount;
    }
}