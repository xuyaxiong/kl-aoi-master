import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { SysDictModule } from './dict/SysDict.module';
import { DefectModule } from './defect/defect.module';
import { FlawModule } from './flaw/flaw.module';
import { MaterialModule } from './material/material.module';
import { PatternModule } from './pattern/pattern.module';
import { RecipeModule } from './recipe/recipe.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import AppConfig from '../app.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '123456',
      database: AppConfig.dbName,
      timezone: '+08:00',
      logging: false,
      autoLoadEntities: true,
      synchronize: true,
      connectTimeout: 15_000,
    }),
    SysDictModule,
    DefectModule,
    FlawModule,
    MaterialModule,
    PatternModule,
    RecipeModule,
    UserModule,
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
