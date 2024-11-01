import { Table, Column, Model } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'user',
  freezeTableName: true,
  paranoid: true,
  underscored: true,
})
export class User extends Model<User> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column
  name: string;

  @Column
  password: string;

  @Column
  isLock: number;

  @Column
  loginTime: Date;

  toJSON() {
    const data = super.toJSON();
    delete data.password;
    return data;
  }
}
