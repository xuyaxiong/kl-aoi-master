import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Pattern {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  color: string;

  @Column()
  modelFile: string;
}
