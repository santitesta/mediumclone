import { UserEntity } from "@app/user/user.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ArrayContains, DataSource, DeleteResult, Repository } from "typeorm";
import { ArticleEntity } from "./article.entity";
import { CreateArticleDto } from "./dto/createArticle.dto";
import { ArticleResponseInterface } from "./types/articleResponse.interface";
import { HttpException } from "@nestjs/common/exceptions";
import { HttpStatus } from "@nestjs/common/enums";
import slugify from "slugify";
import { ArticlesResponseInterface } from "./types/articlesResponse.interface";

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private dataSource: DataSource
  ) { }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();

    Object.assign(article, createArticleDto);

    if (!article.tagList) {
      article.tagList = [];
    }

    article.slug = this.getSlug(createArticleDto.title);

    article.author = currentUser;

    return await this.articleRepository.save(article);
  }

  async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
    const queryBuilder = this.dataSource.getRepository(ArticleEntity).createQueryBuilder(
      'articles',
    ).leftJoinAndSelect(
      'articles.author',
      'author');

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}`,
      })
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        where: {
          username: query.author
        }
      })
      queryBuilder.andWhere('articles.authorId = :id', {
        id: author?.id
      })
    }

    if (query.orderBy) {
      queryBuilder.orderBy('articles.createdAt', query.orderBy);
    }

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();
    const articlesCount = await queryBuilder.getCount();
    // const articles = await this.articleRepository.find() //Another way to do it, easier. Take = limit, skip = offset
    // const articlesCount = await this.articleRepository.count()

    return { articles, articlesCount };

  }

  async findBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({ where: { slug } });
  }

  async updateArticle(
    slug: string,
    updateArticleDto: CreateArticleDto,
    currentUserId: number
  ): Promise<ArticleEntity> {
    const article = await this.findBySlug(slug);

    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN);
    }

    Object.assign(article, updateArticleDto)

    return await this.articleRepository.save(article);
  }

  async deleteArticle(slug: string, currentUserId: number): Promise<DeleteResult> {
    const article = await this.findBySlug(slug)

    if (!article) {
      throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
    }

    if (article.author.id !== currentUserId) {
      throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
    }

    return await this.articleRepository.delete({ slug });
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true })
      + '-'
      + (Math.random() * Math.pow(36, 6) | 0).toString(36)
    )
  }
}