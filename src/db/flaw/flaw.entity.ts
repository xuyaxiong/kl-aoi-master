import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Flaw {
  @PrimaryGeneratedColumn()
  id: number;

  materialId: string;

  patternId: number;

  feature: string;

  @Column()
  position: string;

  @Column()
  type: number;

  @Column()
  affirmType: number;

  @Column()
  userid: string;

  @Column()
  mappingX: number;

  @Column()
  mappingY: number;

  @Column()
  bin: number;

  @Column()
  imgIndex: number;
}
