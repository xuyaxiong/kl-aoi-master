import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  config: string;

  @Column({ nullable: true })
  sort: number;
}
