import { Injectable } from '@nestjs/common';
import { SysDictType } from './SysDictType.entity';
import { SysDictItem } from './SysDictItem.entity';
import {
  AddDictTypeParam,
  AddDictItemParam,
  GetDictItemParam,
  GetDictTypeParam,
  GetDictItemListParam,
  UpdateDictItemParam,
  GetItemListParam,
} from './SysDict.param';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SysDictService {
  constructor(
    @InjectRepository(SysDictType)
    private readonly sysDictTypeRepository: Repository<SysDictType>,
    @InjectRepository(SysDictItem)
    private readonly sysDictItemRepository: Repository<SysDictItem>,
  ) {}

  async getDictTypeList(): Promise<SysDictType[]> {
    return await this.sysDictTypeRepository.find();
  }

  async addDictType(addDictTypeParam: AddDictTypeParam): Promise<SysDictType> {
    return this.sysDictTypeRepository.save(addDictTypeParam);
  }

  async addDictItem(addDictItemParam: AddDictItemParam) {
    return this.sysDictItemRepository.save(addDictItemParam);
  }

  async updateDictItem(updateDictItemParam: UpdateDictItemParam) {
    const dictItem = await this.sysDictItemRepository.findOne({
      where: {
        typeCode: updateDictItemParam.typeCode,
        code: updateDictItemParam.code,
      },
    });
    if (updateDictItemParam.name) dictItem.name = updateDictItemParam.name;
    dictItem.value = updateDictItemParam.value;
    await this.sysDictItemRepository.save(dictItem);
  }

  async getDictTypeByCode(
    getDictTypeParam: GetDictTypeParam,
  ): Promise<SysDictType> {
    const sysDictType = await this.sysDictTypeRepository.findOne({
      where: {
        ...getDictTypeParam,
      },
    });
    return sysDictType;
  }

  async getDictItemByCode(
    getDictItemParam: GetDictItemParam,
    attributes: string[] = null,
  ): Promise<SysDictItem> {
    let conditions = {
      where: {
        ...getDictItemParam,
      },
    };
    if (attributes) conditions['attributes'] = attributes;
    const sysDictItem = await this.sysDictItemRepository.findOne(conditions);
    return sysDictItem;
  }

  async getDictItemListByTypeCode(
    getDictItemListParam: GetDictItemListParam,
    attributes: any[] = null,
  ): Promise<SysDictItem[]> {
    let conditions = {
      where: {
        ...getDictItemListParam,
      },
    };
    if (attributes) conditions['attributes'] = attributes;
    const sysDictItemList = await this.sysDictItemRepository.find(conditions);
    return sysDictItemList;
  }

  async getDictItemListByCodeAndName(
    getItemListParam: GetItemListParam,
    attributes: any[] = null,
  ): Promise<SysDictItem[]> {
    let conditions = {
      where: {
        ...getItemListParam,
      },
    };
    if (attributes) conditions['attributes'] = attributes;
    const sysDictItemList = await this.sysDictItemRepository.find(conditions);
    return sysDictItemList;
  }
}
