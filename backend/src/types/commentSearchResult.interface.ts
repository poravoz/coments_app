import { CommentSearchBody } from "./commentSearchBody.interface";

export interface CommentSearchResult { 
    hits: {
        total: number;
        hits: Array<{
          _source: CommentSearchBody;
        }>;
      };
}