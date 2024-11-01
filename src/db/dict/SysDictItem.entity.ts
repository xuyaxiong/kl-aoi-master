import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'sys_dict_item',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class SysDictItem extends Model<SysDictItem> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column
  typeCode: string;
  @Column
  code: string;
  @Column
  name: string;
  @Column
  value: string;
  @Column
  status: number;
  @Column
  desc: string;
  @Column
  sort: number;
}
