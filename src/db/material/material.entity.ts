import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Material {
  @PrimaryGeneratedColumn()
  id: string;
  @Column()
  sn: string;
  @Column()
  recipeId: number;

  @Column()
  startTime: Date;

  @Column()
  endTime: Date;

  @Column()
  outputPath: string;

  @Column()
  dataOutputPath: string; // 客户数据输出路径

  @Column()
  rectifyParams: string;

  @Column()
  detectLensParams: string;

  @Column()
  imgInfo: string;
}
