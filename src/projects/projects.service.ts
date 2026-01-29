import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({ data: createProjectDto });
  }

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { order: 'asc' },
      include: { stats: true },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { stats: true },
    });

    if (!project) {
      throw new NotFoundException(`project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: { stats: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.project.delete({ where: { id } });
  }
}
