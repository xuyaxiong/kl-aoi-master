import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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

@Injectable()
export class SysDictService {
  constructor(
    @InjectModel(SysDictType)
    private sysDictTypeModel: typeof SysDictType,
    @InjectModel(SysDictItem)
    private sysDictItemModel: typeof SysDictItem,
  ) {}

  async findAll(): Promise<SysDictType[]> {
    return await this.sysDictTypeModel.findAll();
  }

  async addDictType(addDictTypeParam: AddDictTypeParam): Promise<SysDictType> {
    const dictType = this.sysDictTypeModel.build(addDictTypeParam);
    return await dictType.save();
  }

  async addDictItem(addDictItemParam: AddDictItemParam) {
    await this.sysDictItemModel.sequelize.transaction(async (transaction) => {
      const dictItem = this.sysDictItemModel.build(addDictItemParam);
      return await dictItem.save({ transaction });
    });
  }

  async updateDictItem(updateDictItemParam: UpdateDictItemParam) {
    const dictItem = await this.sysDictItemModel.findOne({
      where: {
        typeCode: updateDictItemParam.typeCode,
        code: updateDictItemParam.code,
      },
    });
    if (updateDictItemParam.name) dictItem.name = updateDictItemParam.name;
    dictItem.value = updateDictItemParam.value;
    await dictItem.save();
  }

  async getDictTypeByCode(
    getDictTypeParam: GetDictTypeParam,
  ): Promise<SysDictType> {
    const sysDictType = await this.sysDictTypeModel.findOne({
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
    const sysDictItem = await this.sysDictItemModel.findOne(conditions);
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
    const sysDictItemList = await this.sysDictItemModel.findAll(conditions);
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
    const sysDictItemList = await this.sysDictItemModel.findAll(conditions);
    return sysDictItemList;
  }
}
