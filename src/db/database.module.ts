import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseService } from './database.service';
import { SysDictModule } from './dict/SysDict.module';
import { DefectModule } from './defect/defect.module';
import { FlawModule } from './flaw/flaw.module';
import { MaterialModule } from './material/material.module';
import { PatternModule } from './pattern/pattern.module';
import { RecipeModule } from './recipe/recipe.module';
import { UserModule } from './user/user.module';

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
