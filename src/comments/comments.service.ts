import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, userId: string): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id: createCommentDto.postId },
    });

    if (!post) {
      throw new NotFoundException(`post with ID ${createCommentDto.postId} not found`);
    }

    if (!post.published) {
      throw new ForbiddenException('cannot comment on unpublished post');
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        postId: createCommentDto.postId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });
  }

  async findByPost(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    comments: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
    isAdmin: boolean
  ): Promise<any> {
    const existingComment = await this.prisma.comment.findUnique({ where: { id } });

    if (!existingComment) {
      throw new NotFoundException(`comment with ID ${id} not found`);
    }

    if (existingComment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('you do not have permission to update this comment');
    }

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const existingComment = await this.prisma.comment.findUnique({ where: { id } });

    if (!existingComment) {
      throw new NotFoundException(`comment with ID ${id} not found`);
    }

    if (existingComment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('you do not have permission to delete this comment');
    }

    await this.prisma.comment.delete({ where: { id } });
  }
}
