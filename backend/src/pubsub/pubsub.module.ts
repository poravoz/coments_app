import { Module, Global } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const PUB_SUB = 'PUB_SUB';

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useFactory: () => {
        return new PubSub();
      },
    },
  ],
  exports: [PUB_SUB],
})
export class PubSubModule {}