import { Table, Column, Model } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'recipe',
  freezeTableName: true,
  paranoid: true,
})
export class Recipe extends Model<Recipe> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column
  name: string;

  @Column
  config: string;

  @Column
  sort: number;
}
