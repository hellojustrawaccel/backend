import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string): Promise<any> {
    const post = await this.prisma.post.create({
      data: { ...createPostDto, authorId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    isAdmin: boolean = false,
    published?: boolean
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (!isAdmin) {
      where.published = true;
    } else if (published !== undefined) {
      where.published = published;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const postsWithCounts = posts.map((post) => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    }));

    return {
      posts: postsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, isAdmin: boolean = false): Promise<any> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`post with ID ${id} not found`);
    }

    if (!isAdmin && !post.published) {
      throw new NotFoundException(`post with ID ${id} not found`);
    }

    return {
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    };
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
    isAdmin: boolean
  ): Promise<any> {
    const existingPost = await this.prisma.post.findUnique({ where: { id } });

    if (!existingPost) {
      throw new NotFoundException(`post with ID ${id} not found`);
    }

    if (existingPost.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('you do not have permission to update this post');
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    };
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const existingPost = await this.prisma.post.findUnique({ where: { id } });

    if (!existingPost) {
      throw new NotFoundException(`post with ID ${id} not found`);
    }

    if (existingPost.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('you do not have permission to delete this post');
    }

    await this.prisma.post.delete({ where: { id } });
  }

  async findByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 10,
    isAdmin: boolean = false
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { authorId };

    if (!isAdmin) {
      where.published = true;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    const postsWithCounts = posts.map((post) => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    }));

    return {
      posts: postsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
