import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { LessThan } from "typeorm";
import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { checkAuth } from "../src/middlewares/checkAuth";
import { Context } from "../src/types/Context";

import { CreatePostInput } from "../src/types/CreatePostInput";
import { PaginatedPosts } from "../src/types/PaginatedPosts";
import { PostMutationResponse } from "../src/types/PostMutationResponse";
import { UpdatePostInput } from "../src/types/UpdatePostInput";

@Resolver((_of) => Post)
export class PostResolver {
  @FieldResolver((_return) => String)
  textSnippet(@Root() root: Post) {
    if (root.text.length <= 50) return root.text;
    return root.text.slice(0, 50).concat("...");
  }

  @FieldResolver((_return) => User)
  async user(@Root() root: Post) {
    return await User.findOne(root.userId);
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
      const totalPostsCount = await Post.count();
      const realLimit = Math.min(10, limit);
      const findOptions: { [key: string]: any } = {
        order: {
          createdAt: "DESC",
        },
        take: realLimit,
      };

      let lastPost: Date | undefined;

      if (cursor) {
        findOptions.where = {
          createdAt: LessThan(cursor),
        };
      }

      const posts = await Post.find(findOptions);
      lastPost = posts[posts.length - 1].createdAt as Date;

      return {
        totalCount: totalPostsCount,
        cursor: lastPost,
        hasMore: posts.length >= limit ? true : false,
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
}