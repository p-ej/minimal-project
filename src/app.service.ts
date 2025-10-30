import { Injectable } from '@nestjs/common';
import { Test } from './test/test.entitiy';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTestDto } from './dtos/create-test.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
  ) {}

  async create(dto: CreateTestDto) {
    const newTest = this.testRepo.create({ ...dto });
    return await this.testRepo.save(newTest);
  }

  async findAll() {
    return await this.testRepo.find();
  }
  getHealth(): string {
    return 'OK';
  }

}
