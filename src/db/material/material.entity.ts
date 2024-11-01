import { Table, Column, Model } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'material',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class Material extends Model<Material> {
  @Column({
    primaryKey: true,
  })
  id: string;

  @Column
  sn: string;

  @Column
  recipeId: number;

  @Column
  startTime: Date;

  @Column
  endTime: Date;

  @Column
  outputPath: string;

  @Column
  dataOutputPath: string; // 客户数据输出路径

  @Column
  rectifyParams: string;

  @Column
  detectLensParams: string;

  @Column
  imgInfo: string;
}
