import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class TestResolver {
  @Query(() => String)
  hello(): string {
    return 'Server is running!';
  }
}