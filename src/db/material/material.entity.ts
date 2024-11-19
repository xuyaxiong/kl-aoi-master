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

  @Column({ nullable: true })
  detectResult: string;

  @Column({ default: 0 })
  detectNG: number;

  @Column({ nullable: true })
  affirmUserId: number;

  @Column({ nullable: true })
  affirmTime: Date;

  @Column({ nullable: true })
  affirmResult: string;

  @Column({ default: 0 })
  affirmNG: number;
}
