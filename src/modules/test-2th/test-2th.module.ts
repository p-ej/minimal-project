import { Module } from '@nestjs/common';
import { Test2thController } from './test-2th.controller';
import { Test2thService } from './test-2th.service';

@Module({
  controllers: [Test2thController],
  providers: [Test2thService],
})
export class Test2thModule {}
