import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(
    postId: string,
    userId: string
  ): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(`post with ID ${postId} not found`);
    }

    if (!post.published) {
      throw new NotFoundException(`post with ID ${postId} not found`);
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let liked: boolean;

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      liked = false;
    } else {
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      liked = true;
    }

    const likesCount = await this.prisma.like.count({
      where: { postId },
    });

    return { liked, likesCount };
  }

  async getLikeStatus(postId: string, userId: string): Promise<{ liked: boolean }> {
    const like = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { liked: !!like };
  }

  async getPostLikesCount(postId: string): Promise<number> {
    return this.prisma.like.count({
      where: { postId },
    });
  }

  async getUsersWhoLiked(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
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
      this.prisma.like.count({ where: { postId } }),
    ]);

    const users = likes.map((like) => like.user);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
