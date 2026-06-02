// models/VerificationCode.ts
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface VerificationCodeAttributes {
    id: number;
    user_id: number | null;
    contact: string;
    code: string;
    type: 'email' | 'phone';
    purpose: 'register' | 'login' | 'reset_password' | 'bind';
    expires_at: Date;
    verified_at: Date | null;
    created_at: Date;
}

export interface VerificationCodeCreationAttributes 
  extends Optional<VerificationCodeAttributes, 'id' | 'verified_at' | 'created_at'> {}

export class VerificationCode extends Model<VerificationCodeAttributes, VerificationCodeCreationAttributes> {
    declare id: number;
    declare user_id: number | null;
    declare contact: string;
    declare code: string;
    declare type: 'email' | 'phone';
    declare purpose: 'register' | 'login' | 'reset_password' | 'bind';
    declare expires_at: Date;
    declare verified_at: Date | null;
    declare created_at: Date;
}

export default function initVerificationCode(
    sequelize: Sequelize,
): typeof VerificationCode {
    VerificationCode.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        contact: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('email', 'phone'),
            allowNull: false,
        },
        purpose: {
            type: DataTypes.ENUM('register', 'login', 'reset_password', 'bind'),
            allowNull: false,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        sequelize,
        tableName: 'verification_codes',
        timestamps: false,
        indexes: [
            {
            name: 'idx_contact_purpose',
            fields: ['contact', 'purpose', 'type'],
            },
            {
            name: 'idx_expires_at',
            fields: ['expires_at'],
            },
        ],
    });
    return VerificationCode;
}