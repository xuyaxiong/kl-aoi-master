import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'defect',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class Defect extends Model<Defect> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column(DataType.TEXT)
  name: string;

  @Column
  color: string;
}
