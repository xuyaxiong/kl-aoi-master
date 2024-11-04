import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Defect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  color: string;
}
