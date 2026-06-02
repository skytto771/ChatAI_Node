// utils/response.util.ts
import { BusinessCode } from '../constants/http-status.enum';
import { BusinessCodeMessage } from '../constants/http-status-message';
import { ApiResponse, PaginatedResponse } from '../types/response.interface';

export class ResponseUtil {
  /**
   * 成功响应
   */
    static success<T>(data: T, message?: string, requestId?: string): ApiResponse<T> {
        return {
            code: BusinessCode.SUCCESS,
            message: message || BusinessCodeMessage[BusinessCode.SUCCESS],
            data,
            timestamp: Date.now(),
            requestId,
        };
    }

    /**
     * 创建成功响应
     */
    static created<T>(data: T, message?: string, requestId?: string): ApiResponse<T> {
        return {
            code: BusinessCode.SUCCESS,
            message: message || '资源创建成功',
            data,
            timestamp: Date.now(), 
            requestId,
        };
    }

    /**
     * 分页响应
     */
    static paginated<T>(
        data: T[],
        total: number,
        page: number,
        pageSize: number,
        message?: string,
        requestId?: string
    ): PaginatedResponse<T> {
        return {
            code: BusinessCode.SUCCESS,
            message: message || BusinessCodeMessage[BusinessCode.SUCCESS],
            data,
            timestamp: Date.now(),
            requestId,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    /**
     * 错误响应
     */
    static error(
        businessCode: number,
        message: string,
        requestId?: string
    ): ApiResponse<null> {
        return {
            code: businessCode,
            message,
            data: null,
            timestamp: Date.now(),
            requestId,
        };
    }
}