import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle/:postId')
  @UseGuards(JwtAuthGuard)
  async toggle(@Request() req, @Param('postId') postId: string) {
    return this.likesService.toggle(postId, req.user.id);
  }

  @Get('status/:postId')
  @UseGuards(JwtAuthGuard)
  async getLikeStatus(@Request() req, @Param('postId') postId: string) {
    return this.likesService.getLikeStatus(postId, req.user.id);
  }

  @Get('count/:postId')
  async getPostLikesCount(@Param('postId') postId: string) {
    const count = await this.likesService.getPostLikesCount(postId);
    return { count };
  }

  @Get('users/:postId')
  async getUsersWhoLiked(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.likesService.getUsersWhoLiked(postId, page, limit);
  }
}
