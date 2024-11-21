import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Flaw {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  materialId: string;

  @Column()
  patternId: number;

  @Column({ type: 'text' })
  feature: string;

  @Column()
  position: string;

  @Column()
  type: number;

  @Column({ nullable: true })
  affirmType?: number;

  @Column()
  imgIndex: number;
}
