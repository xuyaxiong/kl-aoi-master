import { Table, Column, Model, Default } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'flaw',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class Flaw extends Model<Flaw> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  materialId: string;

  patternId: number;

  feature: string;

  @Column
  position: string;

  @Default(-1)
  @Column
  type: number;

  @Column
  affirmType: number;

  @Column
  userid: string;

  @Column
  mappingX: number;

  @Column
  mappingY: number;

  @Column
  bin: number;

  @Column
  imgIndex: number;
}
