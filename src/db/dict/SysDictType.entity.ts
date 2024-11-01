import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'sys_dict_type',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class SysDictType extends Model<SysDictType> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column
  typeCode: string;
  @Column
  typeName: string;
  @Column
  desc: string;
  @Column
  sort: number;
}
