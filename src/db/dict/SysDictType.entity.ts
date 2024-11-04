import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SysDictType {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  typeCode: string;
  @Column()
  typeName: string;
  @Column()
  desc: string;
  @Column()
  sort: number;
}
