// models/User.ts
import bcrypt from "bcryptjs"
import {
    Sequelize,
    DataTypes,
    Model,
    Optional,
} from 'sequelize';

export interface UserAttributes {
    id: number;
    username: string;
    password?: string;
    email: string;
    phone: string;
    nickname: string;
    bio: string;
    avatarUrl: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive' | "banned";
    lastLoginAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null; // paranoid 模式
}

export interface UserCreationAttributes extends Optional<UserAttributes,  "id" | "bio" | "phone" | "nickname" | "lastLoginAt" | "deletedAt" | 'password' | 'avatarUrl'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    // 字段声明（必须，才能通过 this.xxx 访问）
    declare id: number;
    declare username: string;
    declare password: string;
    declare email: string;
    declare phone: string;
    declare avatarUrl: string;
    declare nickname: string ;
    declare bio: string ;
    declare role: "admin" | "user";
    declare status: "active" | "inactive" | "banned";
    declare lastLoginAt: Date ;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date | null;

    // ====== 实例方法 ======
    // 实例方法：返回安全信息（不包含密码）
    toJSON(this: User): Omit<UserAttributes, "password"> {
        const values = this.get({ plain: true }) as UserAttributes;
        delete (values as any).password;
        return values as Omit<UserAttributes, 'password'>;
    };

    // 实例方法：验证密码
    async validatePassword(password: string) {
        if (!password) {
            throw new Error("密码不能为空");
        }
        if(password === this.password){
            return true
        }
        return await bcrypt.compare(password, this.password);
    };

    // 静态方法：安全查找
    static async findOneSafe(options:any): Promise<User | null> {
        try {
            return await this.findOne({
                ...options,
                attributes: { exclude: ["password"] },
            });
        } catch (error) {
        throw new Error(`查找用户失败: ${(error as Error).message}`);
        }
    };

    // 静态方法：安全查找所有
    static async findAllSafe(options = {}): Promise<User[]> {
        try {
        return await this.findAll({
            ...options,
            attributes: { exclude: ["password"] },
        });
        } catch (error) {
        throw new Error(`查找用户列表失败: ${(error as Error).message}`);
        }
    };

    // 关联定义
    static associate(models:any) {
        User.hasMany(models.File, {
            foreignKey: "user_id",
            as: "files",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });

        User.hasOne(models.UserAvatar, {
            foreignKey: "user_id",
            as: "avatar",
            scope: { isActive: true },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });

        User.hasMany(models.UserAvatar, {
            foreignKey: "user_id",
            as: "avatars",
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        });
    };
}

export default function initUser(sequelize: Sequelize){
    User.init(
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                comment: "用户ID",
            },
            username: {
                type: DataTypes.STRING(12),
                allowNull: false,
                unique: {
                    name: "username_unique",
                    msg: "用户名已存在",
                },
                validate: {
                    len: {
                        args: [4, 12],
                        msg: "用户名长度必须在4-12个字符之间",
                    },
                    isAlphanumeric: {
                        msg: "用户名只能包含字母和数字",
                    },
                    notEmpty: {
                        msg: "用户名不能为空",
                    },
                },
                comment: "用户名",
            },
            role:{
                type: DataTypes.ENUM("admin", "user"),
                allowNull: false,
                defaultValue: "user",
                comment: "用户角色",
            },
            password: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    len: {
                        args: [6, 20],
                        msg: "密码长度必须在6-20个字符之间",
                    },
                    notEmpty: {
                        msg: "密码不能为空",
                    },
                },
                comment: "密码（bcrypt加密）",
            },
            email: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: {
                    name: "email_unique",
                    msg: "邮箱已被注册",
                },
                validate: {
                    isEmail: {
                        msg: "邮箱格式不正确，例如：user@example.com",
                    },
                },
                comment: "邮箱",
            },
            phone: {
                type: DataTypes.STRING(11),
                allowNull: true,
                unique: {
                    name: "phone_unique",
                    msg: "手机号已被注册",
                },
                validate: {
                    is: {
                        args: /^1[3-9]\d{9}$/,
                        msg: "手机号格式不正确，必须是11位数字且以1开头",
                    },
                },
                comment: "手机号",
            },
            avatarUrl: {
                type: DataTypes.STRING(500),
                allowNull: true,
                comment: "用户头像URL",
            },
            nickname: {
                type: DataTypes.STRING(20),
                allowNull: true,
                validate: {
                    len: {
                        args: [0, 20],
                        msg: "昵称长度不能超过20个字符",
                    },
                },
                comment: "昵称",
            },
            bio: {
                type: DataTypes.STRING(200),
                allowNull: true,
                validate: {
                    len: {
                        args: [0, 200],
                        msg: "个人简介长度不能超过200个字符",
                    },
                },
                comment: "个人简介",
            },
            status: {
                type: DataTypes.ENUM("active", "inactive", "banned"),
                defaultValue: "active",
                validate: {
                    isIn: {
                        args: [["active", "inactive", "banned"]],
                        msg: "用户状态必须是 active、inactive 或 banned",
                    },
                },
                comment: "用户状态",
            },
            lastLoginAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: "last_login_at",
                validate: {
                    isDate: {
                        msg: "最后登录时间格式不正确",
                        args: true,
                    }
                },
                comment: "最后登录时间",
            },
        },
        {
            sequelize,
            tableName: "users",
            timestamps: true,
            underscored: true,
            paranoid: true,
            indexes: [
                { unique: true, fields: ["username"], name: "idx_username_unique" },
                { unique: true, fields: ["email"], name: "idx_email" },
                { unique: true, fields: ["phone"], name: "idx_phone" },
                { fields: ["status"], name: "idx_status" },
            ],
            hooks: {
                beforeCreate: async (user) => {
                    if (user.password) {
                        user.password = await bcrypt.hash(user.password, 10);
                    }
                },
                beforeUpdate: async (user) => {
                    if (user.changed("password")) {
                        user.password = await bcrypt.hash(user.password, 10);
                    }
                },
            },
        },
    );

    return User;
};
