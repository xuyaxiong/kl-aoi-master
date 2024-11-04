import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { AOIDBService } from './aoiDB.service';
import {
  DBDto,
  InsertToDBDto,
  DeleteFromDBDto,
  CoreLearnDto,
  CropSampleData,
  FeatureExtractDto,
  CropSamplesBySrcDto,
  InsertSamplesDto,
} from './aoiDB.param';

@ApiTags('aoiDB')
@Controller('aoiDB')
export class AOIDBController {
  constructor(private aoiDBService: AOIDBService) {}

  @Get('findAll')
  @ApiOperation({ summary: '查找所有db' })
  findAll(): string[] {
    return this.aoiDBService.findAll();
  }

  @Post('load')
  @ApiOperation({
    summary: '加载DB',
    description: '加载DB到内存中，不存在则创建一个新的DB',
  })
  @ApiBody({ type: DBDto })
  @ApiResponse({
    type: Number,
    status: 200,
    description: 'db的条目总数',
  })
  load(
    @Body('db') db: string,
    @Body('GPUIndex') GPUIndex: number,
  ): Promise<number> {
    return this.aoiDBService.load(db);
  }

  @Post('release')
  @ApiOperation({
    summary: '释放DB',
    description: '释放DB',
  })
  @ApiBody({ type: DBDto })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: '此操作是否成功',
  })
  release(
    @Body('db') db: string,
    @Body('type') GPUIndex: number,
  ): Promise<boolean> {
    return this.aoiDBService.release(db);
  }

  @Post('delete')
  @ApiOperation({
    summary: '删除db文件',
    description: '删除db文件，若此db文件已被加载到内存中，此接口会先释放再删除',
  })
  @ApiBody({ type: DBDto })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: '此操作是否成功',
  })
  delete(
    @Body('db') db: string,
    @Body('GPUIndex') GPUIndex: number,
  ): Promise<boolean> {
    return this.aoiDBService.delete(db);
  }

  @Post('insert')
  @ApiOperation({
    summary: '插入数据',
  })
  @ApiBody({ type: InsertToDBDto })
  @ApiResponse({
    type: Number,
    status: 200,
    description: 'db的条目总数',
  })
  insert(@Body() body: InsertToDBDto): Promise<number> {
    return this.aoiDBService.insert(body.db, body.data);
  }

  @Post('eraseByIds')
  @ApiOperation({
    summary: '通过id列表删除数据',
  })
  @ApiBody({ type: DeleteFromDBDto })
  @ApiResponse({
    type: Number,
    status: 200,
    description: 'db的条目总数',
  })
  eraseByIds(@Body() body: DeleteFromDBDto): Promise<number> {
    return this.aoiDBService.eraseByIds(body.db, body.ids);
  }

  @Post('eraseByType')
  @ApiOperation({
    summary: '通过类型type删除数据',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        db: {
          type: 'string',
          example: 'test.db',
        },
        type: {
          type: 'number',
          example: 102,
        },
      },
    },
  })
  @ApiResponse({
    type: Number,
    status: 200,
    description: 'db的条目总数',
  })
  eraseByType(
    @Body() body: { db: string; type: number; GPUIndex: number },
  ): Promise<number> {
    return this.aoiDBService.eraseByType(body.db, body.type);
  }

  @Post('update')
  @ApiOperation({
    summary: '更新db',
  })
  @ApiBody({ type: InsertToDBDto })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: '更新操作是否成功',
  })
  update(@Body() body: InsertToDBDto): Promise<boolean> {
    return this.aoiDBService.update(body.db, body.data);
  }

  @Post('query')
  @ApiOperation({
    summary: '根据feature查询最近邻的type与score',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        db: {
          type: 'string',
          example: 'test.db',
        },
        features: {
          type: 'string[]',
          example: ['3232', 'igjfk'],
        },
        GPUIndex: {
          type: 'number',
          example: '1',
        },
      },
    },
  })
  @ApiResponse({
    schema: {
      type: 'object',
      properties: {
        scores: {
          type: 'number[]',
          example: [0.98, 0.2],
        },
        types: {
          type: 'number[]',
          example: [102, 101],
        },
        ids: {
          type: 'number[]',
          example: [1, 2],
        },
      },
    },
    status: 200,
    description: '{scores,types,ids}',
  })
  query(
    @Body() body: { db: string; features: string[]; GPUIndex: number },
  ): Promise<object> {
    return this.aoiDBService.query(body.db, body.features);
  }

  @Post('coreLearn')
  @ApiOperation({
    summary: '采集正常图像上的特征向量',
    description:
      '采集正常图像上的特征向量，此操作会向db写入特征数据与生成对应的sample小图',
  })
  @ApiBody({ type: CoreLearnDto })
  @ApiResponse({
    type: [CropSampleData],
    status: 200,
    description: '提取的特征数组 [{id,x,y}]',
  })
  coreLearn(@Body() body: CoreLearnDto) {
    return this.aoiDBService.coreLearn(body);
  }

  @Post('featureExtract')
  @ApiOperation({
    summary: '提取小图（256*256）的特征',
  })
  @ApiBody({ type: FeatureExtractDto })
  @ApiResponse({
    type: Object,
    status: 200,
    description: '提取特征结果{feature,position}',
  })
  featureExtract(@Body() body) {
    return this.aoiDBService.featureExtract(body);
  }

  @Post('cropSamplesBySrc')
  @ApiOperation({
    summary: '裁剪sample小图；小图宽高256*256',
  })
  @ApiBody({ type: CropSamplesBySrcDto })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: '操作是否成功',
  })
  cropSamplesBySrc(@Body() body: CropSamplesBySrcDto) {
    return this.aoiDBService.cropSamplesBySrc(body);
  }

  @Post('eraseSamples')
  @ApiOperation({
    summary: '删除sample小图',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        db: {
          type: 'string',
          example: 'test.db',
        },
        srcs: {
          type: 'string[]',
          example: ['D:/kl-storage/gallery/sample/2.large/201.正常/-1.png'],
          description: 'sample小图地址列表',
        },
        GPUIndex: {
          type: 'number',
          example: '1',
        },
      },
    },
  })
  @ApiResponse({
    type: Number,
    status: 200,
    description: 'db的条目总数',
  })
  eraseSamples(@Body() body) {
    return this.aoiDBService.eraseSamples(body.db, body.srcs);
  }

  @Post('updateSamples')
  @ApiOperation({
    summary: '移动sample小图',
    description: 'feature字段可以为空',
  })
  @ApiBody({ type: InsertSamplesDto })
  @ApiResponse({
    type: Boolean,
    status: 200,
    description: '是否成功',
  })
  updateSamples(@Body() body: InsertSamplesDto) {
    return this.aoiDBService.updateSamples(body.db, body.data);
  }

  @Post('insertSamples')
  @ApiOperation({
    summary: 'insertsample小图，同时添加到db',
    description: 'feature字段不能为空！',
  })
  @ApiBody({ type: InsertSamplesDto })
  @ApiResponse({
    type: Number,
    status: 200,
    description: 'db的条目总数',
  })
  insertSamples(@Body() body: InsertSamplesDto) {
    return this.aoiDBService.insertSamples(body.db, body.data);
  }
}
