import { Injectable } from '@nestjs/common';
import { SysDictService } from './dict/SysDict.service';

@Injectable()
export class DatabaseService {
  constructor(public readonly sysDict: SysDictService) {}
}
