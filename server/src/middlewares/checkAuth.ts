import { AuthenticationError } from "apollo-server-errors";
import { MiddlewareFn } from "type-graphql";
import { Context } from "../types/Context";

export const checkAuth: MiddlewareFn<Context> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new AuthenticationError(
      "Not authenticated to perform GraphQL operations"
    );
  }
  return next()
}