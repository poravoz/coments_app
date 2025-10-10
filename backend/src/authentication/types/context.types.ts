import { Request } from 'express';
import { UserEntity } from 'src/users/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
}

export interface GraphQLContext {
  req: AuthenticatedRequest;
  res: Response;
}