// constants/http-status.enum.ts
export enum HttpStatus {
    // 2xx Success
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,

    // 3xx Redirection
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    NOT_MODIFIED = 304,

    // 4xx Client Error
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,

    // 5xx Server Error
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504
}

// 业务错误码枚举
export enum BusinessCode {
    SUCCESS = 0,
    
    // 通用错误 1xxx
    PARAM_ERROR = 1000,
    PARAM_MISSING = 1001,
    PARAM_INVALID = 1002,
    
    // 认证授权 2xxx
    AUTH_FAILED = 2000,
    TOKEN_EXPIRED = 2001,
    TOKEN_INVALID = 2002,
    PERMISSION_DENIED = 2003,
    
    // 用户相关 3xxx
    USER_NOT_FOUND = 3000,
    USER_ALREADY_EXISTS = 3001,
    PASSWORD_ERROR = 3002,
    
    // 资源相关 4xxx
    RESOURCE_NOT_FOUND = 4000,
    RESOURCE_ALREADY_EXISTS = 4001,
    RESOURCE_LOCKED = 4002,
    
    // 系统错误 5xxx
    SYSTEM_ERROR = 5000,
    DATABASE_ERROR = 5001,
    NETWORK_ERROR = 5002,

    // 未知错误
    UNKNOWN_ERROR = 9999,
}