import schedule from "node-schedule";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import { File, FileChunk } from "@/models";

const UPLOAD_TIMEOUT_HOURS = 1; // 未完成上传 1 小时后清理
const FAILED_RETENTION_HOURS = 24; // 失败文件保留 24 小时

/**
 * 清理废弃文件：
 * - uploading/pending 状态超过 1 小时
 * - failed 状态超过 24 小时
 */
async function cleanAbandonedFiles() {
  try {
    const now = new Date();

    // 1. 清理未完成的上传（超时）
    const abandonedFiles = await File.findAll({
      where: {
        status: { [Op.in]: ["uploading", "pending"] },
        createdAt: {
          [Op.lt]: new Date(
            now.getTime() - UPLOAD_TIMEOUT_HOURS * 60 * 60 * 1000,
          ),
        },
      },
    });

    // 2. 清理失败的文件（超过保留期）
    const oldFailedFiles = await File.findAll({
      where: {
        status: "failed",
        createdAt: {
          [Op.lt]: new Date(
            now.getTime() - FAILED_RETENTION_HOURS * 60 * 60 * 1000,
          ),
        },
      },
    });

    const filesToClean = [...abandonedFiles, ...oldFailedFiles];

    if (filesToClean.length === 0) return;

    let deletedCount = 0;

    for (const file of filesToClean) {
      try {
        // 删除物理文件
        if (file.filePath && fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }

        // 删除关联的分片文件
        const chunks = await FileChunk.findAll({
          where: { fileId: file.id },
        });

        for (const chunk of chunks) {
          if (chunk.chunkPath && fs.existsSync(chunk.chunkPath)) {
            fs.unlinkSync(chunk.chunkPath);
          }
        }

        // 删除数据库中的分片记录
        await FileChunk.destroy({ where: { fileId: file.id } });

        // 删除文件记录
        await file.destroy();
        deletedCount++;
      } catch (err) {
        console.error(`清理文件失败 (${file.id}):`, err);
      }
    }

    if (deletedCount > 0) {
      console.log(
        `✅ 清理完成: ${deletedCount} 个废弃文件（未完成: ${abandonedFiles.length}, 失败: ${oldFailedFiles.length}）`,
      );
    }
  } catch (error) {
    console.error("❌ 清理废弃文件任务失败:", error);
  }
}

/**
 * 清理临时目录中残留的孤立文件（存在磁盘但无数据库记录）
 */
async function cleanOrphanTempFiles() {
  try {
    const tempDir = path.join(__dirname, "..", "..", "uploads", "temp");

    if (!fs.existsSync(tempDir)) return;

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const TEMP_MAX_AGE = 24 * 60 * 60 * 1000; // 24 小时
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > TEMP_MAX_AGE) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      } catch {
        // 跳过无法访问的文件
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ 清理临时文件: ${cleanedCount} 个`);
    }
  } catch (error) {
    console.error("❌ 清理临时文件失败:", error);
  }
}

export async function cleanFiles() {
  // 每 30 分钟执行一次
  schedule.scheduleJob("0 */30 * * * *", async () => {
    console.log("🧹 开始清理废弃文件...");
    await cleanAbandonedFiles();
    await cleanOrphanTempFiles();
  });
}
