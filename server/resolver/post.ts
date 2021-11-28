import { UserInputError } from "apollo-server-errors";
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  registerEnumType,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { LessThan } from "typeorm";
import { Post } from "../entities/Post";
import { Upvote } from "../entities/Upvote";
import { User } from "../entities/User";
import { checkAuth } from "../src/middlewares/checkAuth";
import { Context } from "../src/types/Context";

import { CreatePostInput } from "../src/types/CreatePostInput";
import { PaginatedPosts } from "../src/types/PaginatedPosts";
import { PostMutationResponse } from "../src/types/PostMutationResponse";
import { UpdatePostInput } from "../src/types/UpdatePostInput";
import { VoteType } from "../src/types/voteType";

registerEnumType(VoteType, {
  name: "VoteType",
});

@Resolver((_of) => Post)
export class PostResolver {
  @FieldResolver((_return) => VoteType)
  async voteType(
    @Root() root: Post,
    @Ctx() { req, dataLoaders: { voteTypeLoader } }: Context
  ) {
    if (!req.session.userId) {
      return 0;
    }

    // const existingVote = await Upvote.findOne({
    //   postId: root.id,
    //   userId: req.session.userId,
    // });
    // return existingVote ? existingVote.value : 0
    const existingVote = await voteTypeLoader.load({
      postId: root.id,
      userId: req.session.userId,
    });
    return existingVote ? existingVote.value : 0;
  }

  @FieldResolver((_return) => String)
  textSnippet(@Root() root: Post) {
    if (root.text.length <= 50) return root.text;
    return root.text.slice(0, 50).concat("...");
  }

  @FieldResolver((_return) => User)
  async user(
    @Root() root: Post,
    @Ctx() { dataLoaders: { userLoader } }: Context
  ) {
    //return await User.findOne(root.userId);
    return await userLoader.load(root.userId);
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async createPost(
    @Arg("createPostInput") { title, text }: CreatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const newPost = Post.create({
        title,
        text,
        userId: req.session.userId,
      });

      await newPost.save();

      return {
        code: 200,
        success: true,
        message: "Post created successfully!",
        post: newPost,
      };
    } catch (error: any) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: "Internal server errors " + error.message,
      };
    }
  }

  @Query((_return) => PaginatedPosts, { nullable: true })
  async posts(
    @Arg("limit", (_Type) => Int) limit: number,
    @Arg("cursor", { nullable: true }) cursor?: string
  ): Promise<PaginatedPosts | null> {
    try {
      const totalPostCount = await Post.count();
      const realLimit = Math.min(10, limit);

      const findOptions: { [key: string]: any } = {
        order: {
          createdAt: "DESC",
        },
        take: realLimit,
      };

      let lastPost: Post[] = [];
      if (cursor) {
        findOptions.where = { createdAt: LessThan(cursor) };

        lastPost = await Post.find({ order: { createdAt: "ASC" }, take: 1 });
      }

      const posts = await Post.find(findOptions);

      return {
        totalCount: totalPostCount,
        cursor: posts[posts.length - 1].createdAt!,
        hasMore: cursor
          ? posts[posts.length - 1].createdAt?.toString() !==
            lastPost[0].createdAt?.toString()
          : posts.length !== totalPostCount,
        paginatedPosts: posts,
      };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  @Query((_return) => Post, { nullable: true })
  async post(@Arg("id", (_type) => ID) id: number): Promise<Post | undefined> {
    try {
      const post = await Post.findOne(id);
      return post;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async updatePost(
    @Arg("updatePostInput") { id, title, text }: UpdatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const existingPost = await Post.findOne(id);

      if (!existingPost) {
        return {
          code: 400,
          success: false,
          message: "Post not found!",
        };
      }

      if (existingPost.userId !== req.session.userId) {
        return {
          code: 401,
          success: false,
          message: "Unauthorized",
        };
      }

      existingPost.title = title;
      existingPost.text = text;

      await existingPost.save();

      return {
        code: 200,
        success: true,
        message: "Updated post successfully!",
        post: existingPost,
      };
    } catch (error: any) {
      console.log(error);

      return {
        code: 500,
        success: false,
        message: "Internal server errors " + error.message,
      };
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async deletePost(
    @Arg("id", (_type) => ID) id: number,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    try {
      const existingPost = await Post.findOne(id);

      if (!existingPost) {
        return {
          code: 400,
          success: false,
          message: "Post not found!",
        };
      }

      if (existingPost.userId !== req.session.userId) {
        return {
          code: 401,
          success: false,
          message: "Unauthorized",
        };
      }

      await Post.delete(id);
      return {
        code: 200,
        success: true,
        message: "Post deleted successfully!",
      };
    } catch (error: any) {
      console.log(error);

      return {
        code: 500,
        success: false,
        message: "Internal server errors: " + error.message,
      };
    }
  }

  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async vote(
    @Arg("postId", (_type) => Int) postId: number,
    @Arg("inputVoteValue", (_type) => VoteType) inputVoteValue: VoteType,
    @Ctx()
    {
      req: {
        session: { userId },
      },
      connection,
    }: Context
  ): Promise<PostMutationResponse> {
    return await connection.transaction(async (transactionEntityManager) => {
      //check if post exist
      let post = await transactionEntityManager.findOne(Post, postId);

      if (!post) throw new UserInputError("Post not found");

      //check if user has voted or vote

      const existingVote = await transactionEntityManager.findOne(Upvote, {
        postId,
        userId,
      });

      if (existingVote && existingVote.value !== inputVoteValue) {
        await transactionEntityManager.save(Upvote, {
          ...existingVote,
          value: inputVoteValue,
        });

        post = await transactionEntityManager.save(Post, {
          ...post,
          points: post.points + 2 * inputVoteValue,
        });
      }

      if (!existingVote) {
        const newVote = transactionEntityManager.create(Upvote, {
          userId,
          postId,
          value: inputVoteValue,
        });

        await transactionEntityManager.save(newVote);
        post.points = post.points + inputVoteValue;
        post = await transactionEntityManager.save(post);
      }

      return {
        code: 200,
        success: true,
        message: "post voted",
        post,
      };
    });
  }
}
