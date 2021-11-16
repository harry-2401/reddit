import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { UserMutationResponse } from "../src/types/UserMutationResponse";
import { RegisterInput } from "../src/types/RegisterInput";
import { validateRegisterInput } from "../utils/validateRegisterInput";
import { LoginInput } from "../src/types/LoginInput";
import { Context } from "../src/types/Context";
import { COOKIE_NAME } from "../src/constants";
import { ForgotPasswordInput } from "../src/types/ForgotPassword";
import { sendEmail } from "../utils/sendEmail";
import { TokenModel } from "../models/Token";
import { v4 as uuidv4 } from "uuid";
import { ChangePasswordInput } from "../src/types/ChangePasswordInput";

@Resolver()
export class UserResolver {
  @Query((_return) => User, { nullable: true })
  async me(@Ctx() { req }: Context): Promise<User | null | undefined> {
    if (!req.session.userId) {
      return null;
    }

    const user = await User.findOne(req.session.userId);
    return user;
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

  @Mutation((_return) => Boolean)
  async forgotPassword(
    @Arg("forgotPasswordInput") forgotPasswordInput: ForgotPasswordInput
  ): Promise<boolean> {
    const user = await User.findOne({ email: forgotPasswordInput.email });
    console.log(forgotPasswordInput.email);

    if (!user) {
      return true;
    }

    const resetToken = uuidv4();
    const hashedResetToken = await argon2.hash(resetToken);

    await TokenModel.findOneAndDelete({ userId: user.id.toString() });
    await new TokenModel({
      userId: user.id.toString(),
      token: hashedResetToken,
    }).save();

    await sendEmail(
      forgotPasswordInput.email,
      `<a href="http://localhost:3000/change-password?token=${resetToken}&userId=${user.id}">Click here to reset your password </a>`
    );

    return true;
  }

  @Mutation((_return) => UserMutationResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("userId") userId: string,
    @Arg("changePasswordInput") changePasswordInput: ChangePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserMutationResponse> {
    if (changePasswordInput.newPassword.length <= 2) {
      return {
        code: 400,
        success: false,
        message: "Invalid password",
        errors: [
          {
            field: "password",
            message: "Length must be greater than 2",
          },
        ],
      };
    }

    try {
      const resetPasswordTokenRecord = await TokenModel.findOne({ id: userId });
      if (!resetPasswordTokenRecord)
        return {
          code: 400,
          success: false,
          message: "Invalid or expired password reset token",
          errors: [
            {
              field: "token",
              message: "Invalid or expired password reset token",
            },
          ],
        };
      console.log(resetPasswordTokenRecord.token);

      const resetPasswordTokenValid = await argon2.verify(
        resetPasswordTokenRecord.token,
        token
      );

      if (!resetPasswordTokenValid)
        return {
          code: 400,
          success: false,
          message: "Invalid or expired password reset token",
          errors: [
            {
              field: "token",
              message: "Invalid or expired password reset token",
            },
          ],
        };

      const userIdNum = parseInt(userId);

      const user = await User.findOne(userIdNum);

      if (!user) {
        return {
          code: 400,
          success: false,
          message: "User no longer exists",
          errors: [
            {
              field: "token",
              message: "User no longer exists",
            },
          ],
        };
      }

      const updatedPassword = await argon2.hash(
        changePasswordInput.newPassword
      );
      await User.update({ id: userIdNum }, { password: updatedPassword });

      await resetPasswordTokenRecord.deleteOne();

      req.session.userId = user.id;
      return {
        code: 200,
        success: true,
        message: "User password reset successfully!",
        user,
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
}
