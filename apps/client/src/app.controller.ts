import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':user')
  getHello(@Param('user') user: string) {
    return this.appService.getHello(user);
  }
}
