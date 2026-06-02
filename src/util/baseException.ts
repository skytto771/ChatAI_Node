// exceptions/baseException.ts
import { HttpStatus, BusinessCode } from '../constants/http-status.enum';
import { BusinessCodeMessage } from '../constants/http-status-message';

export class BaseException extends Error {
    public readonly httpStatus: HttpStatus;
    public readonly businessCode: BusinessCode;
    public readonly details?: any;

    constructor(
        httpStatus: HttpStatus,
        businessCode: BusinessCode,
        message?: string,
        details?: any
    ) {
        super(message || BusinessCodeMessage[businessCode] || '未知错误');
        this.name = this.constructor.name;
        this.httpStatus = httpStatus;
        this.businessCode = businessCode;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 具体异常类
export class BadRequestException extends BaseException {
    constructor(message?: string, details?: any) {
        super(HttpStatus.BAD_REQUEST, BusinessCode.PARAM_ERROR, message, details);
    }
}

export class UnauthorizedException extends BaseException {
    constructor(message?: string) {
        super(HttpStatus.UNAUTHORIZED, BusinessCode.AUTH_FAILED, message);
    }
}

export class ForbiddenException extends BaseException {
    constructor(message?: string) {
        super(HttpStatus.FORBIDDEN, BusinessCode.PERMISSION_DENIED, message);
    }
}

export class NotFoundException extends BaseException {
    constructor(message?: string) {
        super(HttpStatus.NOT_FOUND, BusinessCode.RESOURCE_NOT_FOUND, message);
    }
}

export class ConflictException extends BaseException {
    constructor(message?: string) {
        super(HttpStatus.CONFLICT, BusinessCode.RESOURCE_ALREADY_EXISTS, message);
    }
}

export class InternalServerErrorException extends BaseException {
    constructor(message?: string) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, BusinessCode.SYSTEM_ERROR, message);
    }
}

export class ValidationException extends BaseException {
    constructor(message?: string, details?: any) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, BusinessCode.PARAM_INVALID, message, details);
    }
}

export class TooManyRequestsException extends BaseException {
    constructor(message?: string) {
        super(HttpStatus.TOO_MANY_REQUESTS, BusinessCode.SYSTEM_ERROR, message);
    }
}