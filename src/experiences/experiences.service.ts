import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';

@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}

  async create(createExperienceDto: CreateExperienceDto) {
    return this.prisma.experience.create({
      data: {
        ...createExperienceDto,
        startDate: new Date(createExperienceDto.startDate),
        endDate: createExperienceDto.endDate ? new Date(createExperienceDto.endDate) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.experience.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
    });

    if (!experience) {
      throw new NotFoundException(`experience with ID ${id} not found`);
    }

    return experience;
  }

  async update(id: string, updateExperienceDto: UpdateExperienceDto) {
    await this.findOne(id);

    const data: any = { ...updateExperienceDto };

    if (updateExperienceDto.startDate) {
      data.startDate = new Date(updateExperienceDto.startDate);
    }

    if (updateExperienceDto.endDate) {
      data.endDate = new Date(updateExperienceDto.endDate);
    }

    return this.prisma.experience.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.experience.delete({ where: { id } });
  }
}
