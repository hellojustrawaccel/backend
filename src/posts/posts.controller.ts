import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto, req.user.id);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('published') published?: string
  ) {
    const isAdmin = req.user?.isAdmin || false;

    let publishedFilter: boolean | undefined;
    if (isAdmin && published !== undefined) {
      publishedFilter = published === 'true';
    }

    return this.postsService.findAll(page, limit, isAdmin, publishedFilter);
  }

  @Get('author/:authorId')
  @UseGuards(OptionalJwtAuthGuard)
  async findByAuthor(
    @Request() req,
    @Param('authorId') authorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    const isAdmin = req.user?.isAdmin || false;

    return this.postsService.findByAuthor(authorId, page, limit, isAdmin);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user?.isAdmin || false;

    return this.postsService.findOne(id, isAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Request() req, @Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto, req.user.id, req.user.isAdmin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req, @Param('id') id: string) {
    await this.postsService.remove(id, req.user.id, req.user.isAdmin);

    return { message: 'post deleted successfully' };
  }
}
