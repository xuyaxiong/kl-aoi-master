import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Material {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  sn: string;

  @Column()
  recipeId: number;

  @Column({ default: () => 'NOW()' })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @Column()
  outputPath: string;

  @Column()
  dataOutputPath: string; // 客户数据输出路径

  @Column({ nullable: true })
  rectifyParams: string;

  @Column({ nullable: true })
  lensParams: string;

  @Column({ nullable: true })
  imgInfo: string;
}
