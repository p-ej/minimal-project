import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async create(@Body() body: { name: string; description?: string }) {
    return await this.appService.create(body.name, body.description);
  }

  @Get()
  async findAll() {
    return await this.appService.findAll();
  }

  @Get('/health')
  getHealth(): string {
    console.log('Request GET /health');
    return this.appService.getHealth();
  }
}
