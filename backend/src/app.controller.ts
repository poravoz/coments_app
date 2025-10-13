import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  @Get('*')
  serveFrontend(@Res() res: Response) {
    // Пропускаем API и GraphQL запросы
    if (res.req.url.startsWith('/api') || res.req.url.startsWith('/graphql')) {
      return;
    }

    // Отдаем index.html для всех остальных запросов (React Router)
    if (process.env.NODE_ENV === 'production') {
      const indexPath = join(__dirname, '..', '..', 'frontend', 'build', 'index.html');
      return res.sendFile(indexPath);
    }
    
    res.status(404).send('Not found - Run frontend separately in development');
  }
}