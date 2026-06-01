// utils/upload.js
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import uploadConfig from '../config/upload'
import { Request } from 'express'

// 确保上传目录存在
const ensureDirExists = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 配置小文件上传存储
const storage = multer.diskStorage({
    destination: (req: Request, file, cb: Function) => {
        let uploadPath = '';

        const date = new Date()
        const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`

        uploadPath = path.join(__dirname, '../uploads/temp', yearMonth);
        
        ensureDirExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req: Request, file: { originalname: string; mimetype: any; size: any }, cb: Function) => {
        // 生成新文件名：时间戳_随机数_原文件名
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const newFilename = `${timestamp}_${random}${ext}`;
        
        // 存储原始文件名和新文件名到req对象
        req.fileInfo = {
            originalName: file.originalname,
            newName: newFilename,
            mimeType: file.mimetype,
            size: file.size
        };
        
        cb(null, newFilename);
    }
});

// 切片文件存储
const chunkStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: (arg0: null, arg1: string) => void) => {
        let uploadPath = '';
        
        const date = new Date()
        const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
        
        uploadPath = path.join(__dirname, '../uploads/temp', yearMonth);
        
        ensureDirExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file: { originalname: string; mimetype: any; size: any }, cb: (arg0: null, arg1: string) => void) => {
        // 生成新文件名：时间戳_随机数_原文件名
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const newFilename = `${timestamp}_${random}${ext}`;
        
        // 存储原始文件名和新文件名到req对象
        req.fileInfo = {
            originalName: file.originalname,
            newName: newFilename,
            mimeType: file.mimetype,
            size: file.size
        };
        
        cb(null, newFilename);
    }
});

// 文件过滤
const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    // const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    // const allowedVideoTypes = /mp4|mov|avi|mkv|webm/;
    
    // if (file.mimetype.startsWith('image/')) {
    //     const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
    //     if (extname) {
    //         cb(null, true);
    //     } else {
    //         cb(new Error('不支持的图片格式'), false);
    //     }
    // } else if (file.mimetype.startsWith('video/')) {
    //     const extname = allowedVideoTypes.test(path.extname(file.originalname).toLowerCase());
    //     if (extname) {
    //         cb(null, true);
    //     } else {
    //         cb(new Error('不支持的视频格式'), false);
    //     }
    // } else {
    //     cb(new Error('只支持图片和视频文件'), false);
    // }
    cb(null, true)
};

const chunkFileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    cb(null, true); // 接受所有文件
};

// 创建multer实例
const smallUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 限制100MB
    }
});

const chunkUpload = multer({
    storage: chunkStorage,
    fileFilter: chunkFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

// 中间件：处理小文件上传
const handleSmallUpload = (fieldName: string) => {
    return (req: Request, res: any, next: () => void) => {
        const uploadSingle = smallUpload.single(fieldName);

        uploadSingle(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            
            if (!req.file) {
                return res.status(400).json({ error: '请选择要上传的文件' });
            }
            const file = req.file
            
            // 构建文件访问URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            let accessUrl = '';
            let finalDir = ''

            const date = new Date()
            const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
            if(file[`mimetype`].startsWith('image/')){
                accessUrl = path.join('/images', yearMonth, file['filename'])
                finalDir = path.join(__dirname, '..', '/uploads/files/images', yearMonth)
            }else if(file[`mimetype`].startsWith('video/')){
                accessUrl = path.join('/videos', yearMonth, file['filename'])
                finalDir = path.join(__dirname, '..', '/uploads/files/videos', yearMonth)
            }else{
                accessUrl = path.join('/others', yearMonth, file['filename'])
                finalDir = path.join(__dirname, '..', '/uploads/files/others', yearMonth)
            }
            const finalPath = path.join(finalDir,file[`filename`])

            const fileUrl = `${req.protocol}://${req.get('host')}` + accessUrl

            // 将完整的文件信息附加到req对象
            req.uploadedFile = {
                originalName: Buffer.from(file[`originalname`], 'latin1').toString('utf8'),
                fileName: file[`filename`],
                mimeType: file[`mimetype`],
                fileSize: file[`size`],
                fileUrl: fileUrl,
                fileHash: req.body.fileHash,
                uploadTime: new Date(),
                sourcePath: file['path'],
                finalPath,
                finalDir,
            };
            
            next();
        });
    };
};

// 中间件：处理切片文件上传
const handleChunkUpload = (fieldName: string) => {
    return async (req: any, res: any, next: () => void) => {

        const chunkUploadSingle = chunkUpload.single(fieldName);
        
        chunkUploadSingle(req, res, (err) => {
            const { fileId, chunkIndex } = JSON.parse(req.body.chunkData)
            
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            
            if (!req.file) {
                return res.status(400).json({ error: '请选择要上传的文件' });
            }
            

            if(!fileId || chunkIndex < 0 ){
                return res.status(401).json({
                    message: '文件id、分片索引缺失'
                })
            }
            
            // 将切片文件信息附加到req对象
            req.uploadedChunk = {
                chunkSize: req.file.size,
                chunkPath: req.file.path,
                uploadTime: new Date(),
                fileId,
                chunkIndex
            };
            
            next();
        });
    };
};

export {
  handleSmallUpload,
  handleChunkUpload,
}