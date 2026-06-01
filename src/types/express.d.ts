// src/types/express.d.ts
import { UserAttributes } from "../models/User"; // 根据实际路径调整
import { JwtPayload } from "jsonwebtoken"; // 假设 decoded 是 jwt payload 类型，可根据实际 jwtUtil 返回类型调整

interface fileInfoAttributes {
    mimeType: string;
    newName: string;
    size: number;
    originalName: string;
}

interface uploadInitAttributes {
  originalName: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  fileUrl: string,
  fileHash: string,
  uploadTime: date,
  sourcePath: string,
  finalPath: string,
  finalDir: string,
}

interface uploadChunkAttributes {
  chunkSize: number,
  chunkPath: string,
  uploadTime: date,
  fileId: number,
  chunkIndex: number,
}

declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes; // 用户信息，可选
      token?: string;        // JWT token
      fileInfo?: fileInfoAttributes;
      tokenDecoded?: JwtPayload | any; // 解码后的 payload
      uploadedFile?: uploadInitAttributes;
      uploadedChunk?: uploadChunkAttributes;
    }
  }
}