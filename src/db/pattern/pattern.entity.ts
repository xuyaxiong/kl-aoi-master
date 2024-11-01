import { Table, Column, Model } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'pattern',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class Pattern extends Model<Pattern> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column
  name: string;

  @Column
  color: string;

  @Column
  modelFile: string;
}
