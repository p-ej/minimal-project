import { Injectable } from '@nestjs/common';
import { Test } from './test/test.entitiy';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
  ) {}

  async create(name: string, description?: string) {
    const newTest = this.testRepo.create({ name, description });
    return await this.testRepo.save(newTest);
  }

  async findAll() {
    return await this.testRepo.find();
  }
  getHealth(): string {
    return 'OK';
  }
  
}
