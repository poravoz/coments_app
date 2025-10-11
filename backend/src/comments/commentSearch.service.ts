import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Comment } from './dto/comment.dto';
import { CommentSearchBody } from 'src/types/commentSearchBody.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class CommentSearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}
  private readonly index = 'comments';

  async indexComment(comment: Comment): Promise<void> {
    await this.elasticsearchService.index<CommentSearchBody>({
      index: this.index,
      document: {
        id: comment.id,
        comment: comment.comment,
        createdAt: comment.createdAt,
      },
    });
  }

  async search(text: string, sort: 'asc' | 'desc' = 'desc'): Promise<CommentSearchBody[]> {
    const result = await this.elasticsearchService.search<CommentSearchBody>({
      index: this.index,
      query: {
        multi_match: {
          query: text,
          fields: ['comment'],
        },
      },
      sort: [
        { createdAt: { order: sort } }
      ]
    });
  
    return result.hits.hits
      .map(hit => hit._source)
      .filter((source): source is CommentSearchBody => !!source);
  }

  async remove(commentId: string): Promise<void> {
    await this.elasticsearchService.deleteByQuery({
      index: this.index,
      query: {
        match: { id: commentId },
      },
    });
  }
  
  async update(comment: Comment): Promise<void> {
    await this.elasticsearchService.updateByQuery({
      index: this.index,
      query: {
        match: { id: comment.id },
      },
      script: {
        source: `
          ctx._source.comment = params.comment;
          ctx._source.createdAt = params.createdAt;
        `,
        params: {
          comment: comment.comment,
          createdAt: comment.createdAt,
        },
      },
    });
  }

}