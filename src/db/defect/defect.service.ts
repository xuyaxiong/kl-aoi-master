import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Defect } from './defect.entity';
import { ConfigService } from '@nestjs/config';
const fs = require('fs');
const path = require('path');
import AppConfig from '../../app.config';

@Injectable()
export class DefectService {
  private samplePath: string;
  constructor(
    @InjectRepository(Defect)
    private readonly defectRepository: Repository<Defect>,
    private readonly configService: ConfigService,
  ) {
    this.samplePath = AppConfig.exportPath.samplePath;
  }

  async findAll(): Promise<Defect[]> {
    return this.defectRepository.find();
  }

  async findOne(id: number): Promise<Defect> {
    return this.defectRepository.findOneBy({ id });
  }

  async create(defect: Partial<Defect>): Promise<Defect> {
    const newDefect = this.defectRepository.create(defect);
    return this.defectRepository.save(newDefect);
  }

  async update(id: number, updateDefect: Partial<Defect>): Promise<Defect> {
    await this.defectRepository.update(id, updateDefect);
    if (updateDefect.name) {
      // 需更新对应的文件夹名
      updateDefectDirName(this.samplePath, id, updateDefect.name);
    }
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    // 需删除对应文件夹
    removeDefectDirById(this.samplePath, id);
    await this.defectRepository.delete(id);
  }
}

function updateDefectDirName(dir: string, defectId: number, newName: string) {
  const dbPathList = fs.readdirSync(dir, { withFileTypes: true });
  dbPathList.forEach((dirent) => {
    if (dirent.isDirectory()) {
      const defectList = fs.readdirSync(path.join(dir, dirent.name));
      defectList.forEach((defectName) => {
        if (defectName.split('.')[0] === defectId + '') {
          const origPath = path.join(dir, dirent.name, defectName);
          const newPath = path.join(dir, dirent.name, `${defectId}.${newName}`);
          fs.renameSync(origPath, newPath);
        }
      });
    }
  });
}

function removeDefectDirById(dir: string, defectId: number) {
  const dbPathList = fs.readdirSync(dir, { withFileTypes: true });
  dbPathList.forEach((dirent) => {
    if (dirent.isDirectory()) {
      const defectList = fs.readdirSync(path.join(dir, dirent.name));
      defectList.forEach((defectName) => {
        if (defectName.split('.')[0] === defectId + '') {
          const origPath = path.join(dir, dirent.name, defectName);
          fs.rmSync(origPath, { recursive: true, force: true });
        }
      });
    }
  });
}
