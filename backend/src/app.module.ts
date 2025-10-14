import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { SpaController } from './spa.controller';
import { TestResolver } from './test.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 🔻 Закоментовано валідацію змінних середовища, бо зараз БД не потрібна
      // validationSchema: Joi.object({
      //   POSTGRES_HOST: Joi.string().required(),
      //   POSTGRES_PORT: Joi.number().required(),
      //   POSTGRES_USER: Joi.string().required(),
      //   POSTGRES_PASSWORD: Joi.string().required(),
      //   POSTGRES_DB: Joi.string().required(),
      //   PORT: Joi.number(),
      //   JWT_SECRET: Joi.string().required(),
      //   JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
      //   JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
      //   JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
      //   JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
      // }),
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema/schema.gql'),
      sortSchema: true,
      playground: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      installSubscriptionHandlers: true,
      context: ({ req, connection }) => {
        if (connection) {
          return { req: connection.context };
        }
        return { req };
      },
    }),
    // DatabaseModule,
    // AuthenticationModule,
    // UsersModule,
    // CommentsModule,
    // CaptchaModule,
  ],
  controllers: [SpaController],
  providers: [TestResolver],
})
export class AppModule {}
