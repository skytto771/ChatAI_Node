// types/response.interface.ts
export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
    timestamp: number;
    requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// 错误详情接口
export interface ErrorDetail {
    field?: string;
    message: string;
    code?: string;
}