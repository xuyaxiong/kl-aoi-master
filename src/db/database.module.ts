import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseService } from './database.service';
import { SysDictModule } from './dict/SysDict.module';
import { SysDictType } from './dict/SysDictType.entity';
import { SysDictItem } from './dict/SysDictItem.entity';

@Global()
@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: 'test-aoi',
      timezone: '+08:00',
      logging: false,
      autoLoadModels: true,
      synchronize: true,
      models: [SysDictType, SysDictItem],
    }),
    SysDictModule,
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
