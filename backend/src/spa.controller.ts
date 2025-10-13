import { Controller, Get, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Controller()
export class SpaController {
  @Get(['/', '/login', '/register'])
  serverSpa(@Res() res: Response) {
    const frontendPath = join(process.cwd(), '..', 'frontend', 'build', 'index.html');
    
    
    if (!existsSync(frontendPath)) {
      throw new NotFoundException('Frontend build not found');
    }
    
    res.sendFile(frontendPath);
  }
}