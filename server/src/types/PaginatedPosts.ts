import { Field, ObjectType } from "type-graphql";
import { Post } from "../../entities/Post";

@ObjectType()
export class PaginatedPosts {
  @Field()
  totalCount!: number;

  @Field((_type) => Date)
  cursor!: Date;

  @Field()
  hasMore!: boolean;

  @Field((type_) => [Post])
  paginatedPosts!: Post[];
}
