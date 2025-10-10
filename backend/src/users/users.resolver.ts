import { Resolver, Query, Mutation, Args, Subscription, Context } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UseGuards } from '@nestjs/common';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';

interface FileUploadType {
    filename: string;
    mimetype: string;
    encoding: string;
    createReadStream: () => NodeJS.ReadableStream;
  
}

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserEntity])
  async users(): Promise<UserEntity[]> {
    return this.usersService.getAllUsers();
  }

  @Query(() => UserEntity)
  async user(@Args('id') id: string): Promise<UserEntity> {
    return this.usersService.getUserById(id);
  }

  @Mutation(() => UserEntity)
  async createUser(@Args('createUserInput') createUserInput: CreateUserDto): Promise<UserEntity> {
    return this.usersService.createUser(createUserInput);
  }

  @Mutation(() => UserEntity)
  @UseGuards(JwtRefreshGuard)
  async updateUser(
    @Args('id') id: string,
    @Args('updateUserInput') updateUserInput: UpdateUserDto,
    @Context() context: any,
  ): Promise<UserEntity> {
    if (context.req.user.id !== id) {
      throw new Error('Forbidden');
    }
    return this.usersService.updateUser(id, updateUserInput);
  }

  @Mutation(() => UserEntity)
  @UseGuards(JwtRefreshGuard)
  async uploadAvatar(
    @Args('userId') userId: string,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: FileUploadType,
    @Context() context: any,
  ): Promise<UserEntity> {
    if (context.req.user.id !== userId) {
      throw new Error('Forbidden');
    }
    
    const { createReadStream, filename, mimetype } = await file;
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      createReadStream()
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', reject)
        .on('end', () => resolve(Buffer.concat(chunks)));
    });

    const processedFile = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype,
        buffer,
        size: buffer.length,
      };
  
      return this.usersService.uploadAvatar(userId, processedFile as any);
    }

  @Mutation(() => UserEntity)
  @UseGuards(JwtRefreshGuard)
  async removeAvatar(
    @Args('userId') userId: string,
    @Context() context: any,
  ): Promise<UserEntity> {
    if (context.req.user.id !== userId) {
      throw new Error('Forbidden');
    }
    return this.usersService.removeAvatar(userId);
  }

  @Mutation(() => UserEntity)
  @UseGuards(JwtRefreshGuard)
  async removeUser(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<UserEntity> {
    if (context.req.user.id !== id) {
      throw new Error('Forbidden');
    }
    return this.usersService.removeUser(id);
  }

  // Real-time Subscriptions
  @Subscription(() => UserEntity)
  userUpdated() {
    return this.usersService.getUserUpdatedSubscription();
  }

  @Subscription(() => UserEntity)
  avatarUpdated() {
    return this.usersService.getAvatarUpdatedSubscription();
  }

  @Subscription(() => UserEntity, {
    name: 'avatarUpdated',
    filter: (payload, variables) => {
      return payload.avatarUpdated.id === variables.userId;
    },
  })
  subscribeToAvatarUpdated(@Args('userId') userId: string) {
    return this.usersService.getAvatarUpdatedSubscription();
  }

  @Subscription(() => UserEntity, {
    name: 'userUpdated',
  })
  subscribeToUserUpdated() {
    return this.usersService.getUserUpdatedSubscription();
  }
}