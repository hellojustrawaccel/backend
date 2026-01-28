import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@Injectable()
export class LinksService {
  constructor(private prisma: PrismaService) {}

  async create(createLinkDto: CreateLinkDto) {
    return this.prisma.link.create({ data: createLinkDto });
  }

  async findAll() {
    return this.prisma.link.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });

    if (!link) {
      throw new NotFoundException(`link with ID ${id} not found`);
    }

    return link;
  }

  async findByType(type: string) {
    return this.prisma.link.findMany({ where: { type }, orderBy: { order: 'asc' } });
  }

  async update(id: string, updateLinkDto: UpdateLinkDto) {
    await this.findOne(id);

    return this.prisma.link.update({ where: { id }, data: updateLinkDto });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.link.delete({ where: { id } });
  }
}
