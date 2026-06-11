// services/FileStorageService.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { FileChunkAttributes } from "@/models/FileChunk";

export class FileStorageService {
    /**
     * 获取文件存储路径
     */
    static getStoragePath(mimeType: string): { finalDir: string; backDir: string, yearMonth:string } {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        let backDir = "";
        let finalDir = "";

        if (mimeType.startsWith("image/")) {
            backDir = "/images";
            finalDir = path.join(__dirname, "..", "/uploads/files/images", yearMonth);
        } else if (mimeType.startsWith("video/")) {
            backDir = "/videos";
            finalDir = path.join(__dirname, "..", "/uploads/files/videos", yearMonth);
        } else {
            backDir = "/others";
            finalDir = path.join(__dirname, "..", "/uploads/files/others", yearMonth);
        }

        return { finalDir, backDir, yearMonth };
    }

    /**
     * 确保目录存在
     */
    static ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * 合并文件分片
     */
    static async mergeChunks(
        chunks: FileChunkAttributes[],
        finalPath: string
    ): Promise<void> {
        const writeStream = fs.createWriteStream(finalPath);

        for (let i = 0; i < chunks.length; i++) {
            const chunkPath = chunks[i].chunkPath;
            await this.waitForFile(chunkPath);

            const readStream = fs.createReadStream(chunkPath);
            await new Promise((resolve, reject) => {
                readStream.pipe(writeStream, { end: false });
                readStream.on("end", resolve);
                readStream.on("error", reject);
            });
        }

        writeStream.end();
        await new Promise((resolve) => writeStream.on("finish", resolve));
    }

    /**
     * 计算文件MD5
     */
    static async calculateFileMD5(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash("md5");
            const stream = fs.createReadStream(filePath);

            stream.on("data", (data) => hash.update(data));
            stream.on("end", () => resolve(hash.digest("hex")));
            stream.on("error", reject);
        });
    }

    /**
     * 验证文件完整性
     */
    static async verifyFileIntegrity(
        filePath: string,
        expectedHash: string
    ): Promise<boolean> {
        const actualHash = await this.calculateFileMD5(filePath);
        return actualHash === expectedHash;
    }

    /**
     * 等待文件出现（避免并发问题）
     */
    private static waitForFile(filePath: string, timeout = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = setInterval(() => {
                if (fs.existsSync(filePath)) {
                    clearInterval(check);
                    resolve();
                } else if (Date.now() - start > timeout) {
                    clearInterval(check);
                    reject(new Error(`文件超时: ${filePath}`));
                }
            }, 100);
        });
    }

    /**
     * 移动临时文件到最终位置
     */
    static async moveTempFile(sourcePath: string, finalPath: string): Promise<void> {
        this.ensureDirectoryExists(path.dirname(finalPath));
        await fs.promises.rename(sourcePath, finalPath);
    }
}