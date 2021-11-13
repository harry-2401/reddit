import { Ctx, Query, Resolver } from "type-graphql";
import { Context } from "../src/types/Context";

@Resolver()
export class HelloResolver {
  @Query(_return => String)
  hello(@Ctx() {req}: Context) {
    console.log(req.session.userId)
    return 'hello'
  }
}