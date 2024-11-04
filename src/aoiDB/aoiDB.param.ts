import { ApiProperty } from '@nestjs/swagger';

export class DBDto {
  @ApiProperty({
    example: 'test.db',
    description: 'db路径；db目录是相对与initEngine给的目录',
  })
  db: string;
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class DBDataDto {
  @ApiProperty({
    example: 1,
    description: '主键',
  })
  id: number;
  @ApiProperty({
    example: 102,
    description: '特征类型',
  })
  type: number;
  @ApiProperty({
    example: 'das',
    description: '384位特征数组转为base64位字符串',
  })
  feature: string;
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class InsertToDBDto {
  @ApiProperty({
    example: 'test.db',
    description: 'db路径；db目录是相对与initEngine给的目录',
  })
  db: string;
  @ApiProperty({
    type: () => [DBDataDto],
    example: [{ id: 1, type: 102, feature: '21321' }],
    description: '数据列表',
  })
  data: DBDataDto[];
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class DeleteFromDBDto {
  @ApiProperty({
    example: 'test.db',
    description: 'db路径；db目录是相对与initEngine给的目录',
  })
  db: string;
  @ApiProperty({
    example: [102, 103],
    description: '删除的id列表',
  })
  ids: number[];
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class CropSampleData {
  @ApiProperty({
    example: -1,
    description: '特征编号；正常特征的编号为负数',
  })
  id: number;
  @ApiProperty({
    example: 234,
    description: '特征起点x',
  })
  x: number;
  @ApiProperty({
    example: 23,
    description: '特征起点y',
  })
  y: number;
}

export class CoreLearnDto {
  @ApiProperty({
    example: 'db/',
    description: 'db路径；db目录是相对与initEngine给的目录',
  })
  path: string;
  @ApiProperty({
    example: 'test.db',
    description: 'db路径；db目录是相对与initEngine给的目录',
  })
  db: string;
  @ApiProperty({
    example: 'D:/1.png',
    description: '提取特征的图像地址',
  })
  src: string;
  @ApiProperty({
    required: false,
    example: 'D:/1.mask.png',
    description: '提取特征的mask图像地址',
  })
  srcMask: string;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '图像宽；默认值为配置文件中的width',
  })
  width: number;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '图像高；默认值为配置文件中的height',
  })
  height: number;
  @ApiProperty({
    required: false,
    example: 1,
    description: '图像通道；默认值为配置文件中的channel',
  })
  channel: number;
  @ApiProperty({
    example: 101,
    description: '正常特征的编号',
  })
  normalId: number;
  @ApiProperty({
    example: 0.9,
    description: '提取特征的阈值',
  })
  threshold: number;
  @ApiProperty({
    example: 'D:/kl-storage/gallery/sample/1.red/101.正常/',
    description: '对应的sample小图的目录',
  })
  sampleDir: string;
  @ApiProperty({
    required: false,
    example: true,
    description: '是否一次性提取所有特征；默认值true',
  })
  learnUntilNone: boolean;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '一次提取的特征数；默认值1024',
  })
  featureCount: number;
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class FeatureExtractDto {
  @ApiProperty({
    example: 'D:/1.png',
    description: '提取特征的图像地址',
  })
  src: string;
  @ApiProperty({
    example: 'D:/temp1.png',
    description: '提取出的特征小图的地址',
  })
  dist: string;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '图像宽；默认值为配置文件中的width',
  })
  width: number;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '图像高；默认值为配置文件中的height',
  })
  height: number;
  @ApiProperty({
    required: false,
    example: 1,
    description: '图像通道；默认值为配置文件中的channel',
  })
  channel: number;
  @ApiProperty({
    example: 100,
    description: '特征起点x坐标',
  })
  x: number;
  @ApiProperty({
    example: 200,
    description: '特征起点y坐标',
  })
  y: number;
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class CropSamplesBySrcDto {
  @ApiProperty({
    example: 'D:/1.png',
    description: '被裁剪图像的地址',
  })
  src: string;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '图像宽；默认值为配置文件中的width',
  })
  width: number;
  @ApiProperty({
    required: false,
    example: 1024,
    description: '图像高；默认值为配置文件中的height',
  })
  height: number;
  @ApiProperty({
    required: false,
    example: 1,
    description: '图像通道；默认值为配置文件中的channel',
  })
  channel: number;
  @ApiProperty({
    example: 'D:/kl-storage/gallery/sample/2.large/201.正常/',
    description: '对应的sample小图的目录',
  })
  sampleDir: string;
  @ApiProperty({
    type: () => [CropSampleData],
    example: [{ id: 1, x: 234, y: 56 }],
    description: 'sample小图裁剪相对于src的坐标列表[{id,x,y}]',
  })
  data: CropSampleData[];
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class InsertUpdateSamplesData {
  @ApiProperty({
    example: 'D:/kl-storage/gallery/sample/2.large/201.正常/-1.png',
    description: '图像地址',
  })
  src: string;
  @ApiProperty({
    example: 'D:/kl-storage/gallery/sample/2.large/202.破损/-1.png',
    description: '图像目标地址',
  })
  dist: string;
  @ApiProperty({
    example: 'AAAAAAAAAAAAwHY7ACCfOwAAAA',
    description: '图像对应特征；更新时此字段可以为空，否则不能为空',
  })
  feature: string;
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}

export class InsertSamplesDto {
  @ApiProperty({
    example: 'test.db',
    description: 'sample小图对应的db',
  })
  db: string;
  @ApiProperty({
    type: () => [InsertUpdateSamplesData],
    description: 'sample小图的地址与特征 [{src,dist,feature}]',
  })
  data: InsertUpdateSamplesData[];
  @ApiProperty({
    example: '1',
    description: '显卡类型',
  })
  GPUIndex: number;
}
