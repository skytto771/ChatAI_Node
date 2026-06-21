// middlewares/errorHandlerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { BaseException } from '../util/baseException';
import { HttpStatus, BusinessCode } from '../constants/http-status.enum';
import { ResponseUtil } from '../util/responseUtil';
import { ApiResponse } from '../types/response.interface';


export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
console.error(`[404] ${req.method} ${req.path}:`);
    
    res.status(404).json({
        code: 404,
        message: `路由 ${req.method} ${req.originalUrl} 不存在`,
        data: null,
        timestamp: Date.now(),
        requestId: req.headers['x-request-id'] as string,
    });
};


export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(`[Error] ${req.method} ${req.path}:`, error);

    // 处理自定义异常
    if (error instanceof BaseException) {
        const response: ApiResponse = {
            code: error.businessCode,
            message: error.message,
            data: error.details || null,
            timestamp: Date.now(),
            requestId: req.headers['x-request-id'] as string,
        };
        return res.status(error.httpStatus).json(response);
    }

    // 处理 Joi 或其他验证错误
    if (error.name === 'ValidationError') {
        const response = ResponseUtil.error(
            BusinessCode.PARAM_INVALID,
            error.message,
            req.headers['x-request-id'] as string
        );
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(response);
    }

    // 处理 JSON 解析错误
    if (error.name === 'SyntaxError') {
        const response = ResponseUtil.error(
        BusinessCode.PARAM_INVALID,
        '请求格式不正确',
        req.headers['x-request-id'] as string
        );
        return res.status(HttpStatus.BAD_REQUEST).json(response);
    }

    // 未知错误
    const response = ResponseUtil.error(
        BusinessCode.SYSTEM_ERROR,
        '服务器内部错误',
        req.headers['x-request-id'] as string
    );
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
};