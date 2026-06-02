// constants/http-status-message.ts
import { HttpStatus, BusinessCode } from './http-status.enum';

export const HttpStatusMessage: Record<number, string> = {
    [HttpStatus.OK]: '请求成功',
    [HttpStatus.CREATED]: '资源创建成功',
    [HttpStatus.ACCEPTED]: '请求已接受',
    [HttpStatus.NO_CONTENT]: '无内容',
    [HttpStatus.BAD_REQUEST]: '请求参数错误',
    [HttpStatus.UNAUTHORIZED]: '未授权',
    [HttpStatus.FORBIDDEN]: '禁止访问',
    [HttpStatus.NOT_FOUND]: '资源不存在',
    [HttpStatus.METHOD_NOT_ALLOWED]: '请求方法不允许',
    [HttpStatus.CONFLICT]: '资源冲突',
    [HttpStatus.UNPROCESSABLE_ENTITY]: '请求无法处理',
    [HttpStatus.TOO_MANY_REQUESTS]: '请求过于频繁',
    [HttpStatus.INTERNAL_SERVER_ERROR]: '服务器内部错误',
    [HttpStatus.NOT_IMPLEMENTED]: '功能未实现',
    [HttpStatus.BAD_GATEWAY]: '网关错误',
    [HttpStatus.SERVICE_UNAVAILABLE]: '服务不可用',
    [HttpStatus.GATEWAY_TIMEOUT]: '网关超时',
};

export const BusinessCodeMessage: Record<number, string> = {
    [BusinessCode.SUCCESS]: '操作成功',
    [BusinessCode.PARAM_ERROR]: '参数错误',
    [BusinessCode.PARAM_MISSING]: '缺少必要参数',
    [BusinessCode.PARAM_INVALID]: '参数格式不正确',
    [BusinessCode.AUTH_FAILED]: '认证失败',
    [BusinessCode.TOKEN_EXPIRED]: '令牌已过期',
    [BusinessCode.TOKEN_INVALID]: '无效的令牌',
    [BusinessCode.PERMISSION_DENIED]: '权限不足',
    [BusinessCode.USER_NOT_FOUND]: '用户不存在',
    [BusinessCode.USER_ALREADY_EXISTS]: '用户已存在',
    [BusinessCode.PASSWORD_ERROR]: '密码错误',
    [BusinessCode.RESOURCE_NOT_FOUND]: '请求的资源不存在',
    [BusinessCode.RESOURCE_ALREADY_EXISTS]: '资源已存在',
    [BusinessCode.RESOURCE_LOCKED]: '资源已锁定',
    [BusinessCode.SYSTEM_ERROR]: '系统错误',
    [BusinessCode.DATABASE_ERROR]: '数据库错误',
    [BusinessCode.NETWORK_ERROR]: '网络错误',
};