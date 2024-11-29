import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
const path = require('path');
const fs = require('fs');
const readline = require('readline');
import { Material } from './material.entity';
import { QueryParam } from './material.param';
import { PageRes } from './material.types';
import { saveFullImg } from 'src/utils/image_utils';
import { Pattern } from '../pattern/pattern.entity';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Pattern)
    private readonly patternRepository: Repository<Pattern>,
  ) {}

  async page(queryParam: QueryParam): Promise<PageRes<Material>> {
    const queryBuilder = this.materialRepository.createQueryBuilder('material');
    if (queryParam.recipeId) {
      queryBuilder.andWhere('material.recipeId = :recipeId', {
        recipeId: `%${queryParam.recipeId}%`,
      });
    }
    if (queryParam.materialId) {
      queryBuilder.andWhere('material.id LIKE :materialId', {
        materialId: `%${queryParam.materialId}%`,
      });
    }
    if (queryParam.sn) {
      queryBuilder.andWhere('material.sn LIKE :sn', {
        sn: `%${queryParam.sn}%`,
      });
    }
    if (queryParam.startTime) {
      queryBuilder.andWhere('material.startTime > :start', {
        start: new Date(queryParam.startTime[0]),
      });
      queryBuilder.andWhere('material.startTime < :end', {
        end: new Date(queryParam.startTime[1]),
      });
    }
    if (queryParam.detectNG !== undefined && queryParam.detectNG !== null) {
      queryBuilder.andWhere('material.detectNG = :detectNG', {
        detectNG: `%${queryParam.detectNG}%`,
      });
    }
    if (queryParam.affirmNG !== undefined && queryParam.affirmNG !== null) {
      queryBuilder.andWhere('material.affirmNG = :affirmNG', {
        affirmNG: `%${queryParam.affirmNG}%`,
      });
    }
    if (queryParam.defectId !== undefined && queryParam.defectId !== null) {
      queryBuilder
        .where("CONCAT(',', material.detectResult, ',') LIKE :detectResult", {
          detectResult: `%,${queryParam.defectId},%`,
        })
        .orWhere("CONCAT(',', material.affirmResult, ',') LIKE :affirmResult", {
          affirmResult: `%,${queryParam.defectId},%`,
        });
    }
    const skipNum = (queryParam.page - 1) * queryParam.pageSize;
    const [data, total] = await queryBuilder
      .orderBy('material.startTime', queryParam.sort)
      .skip(skipNum)
      .take(queryParam.pageSize)
      .getManyAndCount();
    return {
      items: data,
      pageInfo: {
        total,
        page: queryParam.page,
        pageSize: queryParam.pageSize,
        totalPage: Math.ceil(total / queryParam.pageSize),
      },
    };
  }

  async findById(id: string): Promise<Material> {
    return this.materialRepository.findOneBy({ id });
  }

  async create(material: Partial<Material>): Promise<Material> {
    const newMaterial = this.materialRepository.create(material);
    return this.materialRepository.save(newMaterial);
  }

  async update(
    id: string,
    updateMaterial: Partial<Material>,
  ): Promise<Material> {
    await this.materialRepository.update(id, updateMaterial);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.materialRepository.delete(id);
  }

  public async getMapCsvList(materialId: string) {
    const material = await this.findById(materialId);
    const dataOutputPath = material.dataOutputPath;
    const rectifyParams = material.rectifyParams;
    const filePathList = this.getOutputFilePathList(dataOutputPath);
    return {
      rectifyParams: JSON.parse(rectifyParams),
      csvList: filePathList,
    };
  }

  public async getMapCsvResult(filePath: string) {
    const lines = await this.loadSingleOrigData(filePath);
    const rows = [];
    for (const line of lines) {
      const [C, R, chipId, types, dx, dy, dr] = line.split(',');
      rows.push({
        R: parseInt(R),
        C: parseInt(C),
        types,
        LED: parseInt(chipId),
        dx: parseFloat(dx),
        dy: parseFloat(dy),
        dr: parseFloat(dr),
      });
    }
    return rows;
  }

  private getOutputFilePathList(dataOutputPath: string) {
    return fs
      .readdirSync(dataOutputPath)
      .filter((fileName: string) => {
        return fileName.includes('output');
      })
      .sort()
      .map((fileName: string) => path.join(dataOutputPath, fileName));
  }

  private async loadSingleOrigData(filePath: string) {
    const lines = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      lines.push(line);
    }
    lines.slice(1);
    return lines;
  }

  public async saveFullImg(id: string, patternId: number, unit: number) {
    const material = await this.findById(id);
    const pattern = await this.patternRepository.findOneBy({ id: patternId });
    const lensParams = JSON.parse(material.lensParams);
    const imgInfo = JSON.parse(material.imgInfo);
    const patternName = pattern.name;
    const dirName = fs
      .readdirSync(path.join(material.outputPath, 'imgs'))
      .filter((name: string) => {
        return name.includes(patternName);
      })[0];
    const imgDir = `imgs/${dirName}`;
    const outputPath = await saveFullImg(
      imgInfo.width,
      imgInfo.height,
      imgInfo.channel,
      id,
      lensParams,
      material.outputPath,
      imgDir,
      material.dataOutputPath,
      unit ? unit : 5,
      'jpg',
    );
    return outputPath;
  }
}
