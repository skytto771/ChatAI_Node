// config/upload.js
import path from 'path';

export default {
    // 文件分类配置
    categories: {
        images: {
            types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
            extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
            maxSize: 5 * 1024 * 1024,  // 5MB
            dir: 'images'
        },
        videos: {
            types: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'],
            extensions: ['.mp4', '.mpeg', '.mov', '.avi', '.flv'],
            maxSize: 100 * 1024 * 1024,  // 100MB
            dir: 'videos'
        },
        others: {
            types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'text/plain'],
            extensions: ['.pdf', '.doc', '.docx', '.zip', '.txt'],
            maxSize: 20 * 1024 * 1024,  // 20MB
            dir: 'others'
        }
    },
    
    // 通用配置
    uploadDir: path.join(__dirname, '../uploads'),
    
    // 允许的最大文件数（多文件上传）
    maxFiles: 10,
    
    // 大文件分片大小（5MB）
    chunkSize: 5 * 1024 * 1024,
    
    // 临时目录（用于大文件分片）
    tempDir: path.join(__dirname, '../uploads/temp')
};