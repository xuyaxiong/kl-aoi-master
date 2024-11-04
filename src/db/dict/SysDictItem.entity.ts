import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SysDictItem {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  typeCode: string;
  @Column()
  code: string;
  @Column()
  name: string;
  @Column()
  value: string;
  @Column({ default: 1 })
  status: number;
  @Column()
  desc: string;
  @Column()
  sort: number;
}
