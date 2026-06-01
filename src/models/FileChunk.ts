// models/FileChunk.ts
import {
  Sequelize,
  DataTypes,
  Model,
  Optional,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  BelongsToCreateAssociationMixin,
  NonAttribute,
} from 'sequelize';
import type { File } from './File';

// ========== 接口定义 ==========
export interface FileChunkAttributes {
  id: number;
  fileId: number;
  chunkIndex: number;
  chunkSize: number | null;
  chunkPath: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileChunkCreationAttributes
  extends Optional<FileChunkAttributes, 'id' | 'chunkSize'> {}

// ========== 模型类 ==========
export class FileChunk
  extends Model<FileChunkAttributes, FileChunkCreationAttributes>
  implements FileChunkAttributes
{
  declare id: number;
  declare fileId: number;
  declare chunkIndex: number;
  declare chunkSize: number | null;
  declare chunkPath: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // 关联属性
  declare file?: NonAttribute<File>;

  // 关联方法
  declare getFile: BelongsToGetAssociationMixin<File>;
  declare setFile: BelongsToSetAssociationMixin<File, number>;
  declare createFile: BelongsToCreateAssociationMixin<File>;

  // ====== 实例方法 ======
  /**
   * 转换为 JSON 时排除敏感字段（临时路径）
   */
  toJSON(): Omit<FileChunkAttributes, 'chunkPath'> {
    const values = this.get({ plain: true }) as FileChunkAttributes;
    delete (values as any).chunkPath;
    return values;
  }

  // ====== 静态方法 ======
  static associate(models: any) {
    FileChunk.belongsTo(models.File, {
      foreignKey: 'file_id',
      as: 'file',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

// ========== 初始化函数 ==========
export default function initFileChunk(sequelize: Sequelize): typeof FileChunk {
  FileChunk.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        comment: '分片ID',
      },
      fileId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'file_id',
        comment: '关联的文件ID',
        references: {
          model: 'files',
          key: 'id',
        },
      },
      chunkIndex: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'chunk_index',
        comment: '分片序号',
      },
      chunkSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'chunk_size',
        comment: '切片大小',
      },
      chunkPath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'chunk_path',
        comment: '分片临时存储路径',
      },
    },
    {
      sequelize,
      tableName: 'file_chunks',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['file_id', 'chunk_index'],
          name: 'idx_file_chunk',
          unique: true,
        },
        // ⚠️ 原代码中索引包含 is_uploaded 字段，但模型中并无该字段，已移除
        // 如果确实需要该字段，请先在模型中添加，例如：
        // isUploaded: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_uploaded' }
      ],
    }
  );

  return FileChunk;
}