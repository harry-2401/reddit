import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { UserMutationResponse } from "../src/types/UserMutationResponse";
import { RegisterInput } from "../src/types/RegisterInput";
import { validateRegisterInput } from "../utils/validateRegisterInput";
import { LoginInput } from "../src/types/LoginInput";
import { Context } from "../src/types/Context";
import { COOKIE_NAME } from "../src/constants";

@Resolver()
export class UserResolver {
  @Query(_return => User, {nullable : true})
  async me(@Ctx() {req} : Context): Promise<User | null | undefined> {
    if(!req.session.userId) {
      return null;
    }

    const user = await User.findOne(req.session.userId)
    return user
  }
  @Mutation((_return) => UserMutationResponse)
  async register(
    @Arg("registerInput") RegisterInput: RegisterInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    const validateRegisterInputErrors = validateRegisterInput(RegisterInput);

    if (validateRegisterInputErrors !== null) {
      return {
        code: 400,
        success: false,
        ...validateRegisterInputErrors,
      };
    }

    try {
      const { email, username, password } = RegisterInput;

      const existingUser = await User.findOne({
        where: [{ username }, { email }],
      });
      if (existingUser)
        return {
          code: 400,
          success: false,
          message: "Duplicate username or email",
          errors: [
            {
              field: existingUser.username === username ? "username" : "email",
              message:
                (existingUser.username === username ? "Username" : "Email") +
                " already taken",
            },
          ],
        };

      const hasedPassword = await argon2.hash(password);
      const newUser = User.create({
        username,
        password: hasedPassword,
        email,
      });

      const createdUser = await newUser.save();

      //set cookie
      req.session.userId = createdUser.id;

      return {
        code: 200,
        success: true,
        message: "User registration successfully!",
        user: createdUser,
      };
    } catch (error: any) {
      return {
        code: 400,
        success: false,
        message: "Internal server error " + error.message,
      };
    }
  }

  @Mutation((_return) => UserMutationResponse)
  async login(
    @Arg("loginInput") loginInput: LoginInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    try {
      const existingUser = await User.findOne(
        loginInput.usernameOrEmail.includes("@")
          ? { email: loginInput.usernameOrEmail }
          : { username: loginInput.usernameOrEmail }
      );
      console.log(existingUser);

      if (!existingUser) {
        return {
          code: 400,
          success: false,
          message: "User not found",
          errors: [
            {
              field: "UsernameOfEmail",
              message: "Username or email not found",
            },
          ],
        };
      }

      const passwordValid = await argon2.verify(
        existingUser.password,
        loginInput.password
      );

      if (!passwordValid) {
        return {
          code: 400,
          success: false,
          message: "Wrong password",
          errors: [{ field: "password", message: "Wrong password" }],
        };
      }

      //sesion: userId = existingUser.id
      //create session and return cookie
      req.session.userId = existingUser.id;

      return {
        code: 200,
        success: true,
        message: "Logged in successfully!",
        user: existingUser,
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

  @Mutation((_return) => Boolean)
  logout(@Ctx() { req, res }: Context): Promise<boolean> {
    return new Promise((resolve, _rejects) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy((error) => {
        if (error) {
          console.log(`DESTROYING SESSION ERROR ${error}`);
          resolve(false);
        }
        resolve(true);
      });
    });
  }
}
