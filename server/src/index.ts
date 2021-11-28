require("dotenv").config();
import "reflect-metadata";
import express from "express";
import { createConnection } from "typeorm";
import { User } from "../entities/User";
import { Post } from "../entities/Post";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "../resolver/Hello";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { UserResolver } from "../resolver/user";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import session from "express-session";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Context } from "./types/Context";
import { PostResolver } from "../resolver/post";
import cors from "cors";
import { Upvote } from "../entities/Upvote";
import { buildDataLoaders } from "../utils/dataLoader";
import path from "path";

const main = async (): Promise<void> => {
  const connection = await createConnection({
    type: "postgres",
    ...(__prod__
      ? { url: process.env.DATABASE_URL }
      : {
          database: "reddit",
          username: process.env.DB_USERNAME_DEV,
          password: process.env.DB_PASSWORD_DEV,
        }),
    logging: true,
    ...(__prod__
      ? {
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
          ssl: true,
        }
      : {}),
    ...(__prod__ ? {} : { synchronize: true }),
    entities: [User, Post, Upvote],
    migrations: [path.join(__dirname, "/migrations/*")],
  });

  if (__prod__) await connection.runMigrations();

  const app = express();

  app.use(
    cors({
      origin: __prod__
        ? process.env.CORS_ORIGIN_PROD
        : process.env.CORS_ORIGIN_DEV,
      credentials: true,
    })
  );

  //session - cookie
  const mongoUrl = `mongodb+srv://${process.env.SESSION_DB_USERNAME_DEV_PROD}:${process.env.SESSION_DB_PASSWORD_DEV_PROD}@cluster0.zrrxu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  await mongoose.connect(mongoUrl);
  console.log("mongodb connected");

  app.use(
    session({
      name: COOKIE_NAME,
      store: MongoStore.create({
        mongoUrl,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true, //js frontend cannot access the cookie
        secure: __prod__, //cookie only work in https
        sameSite: "lax", //protection against CSRF
        domain: __prod__ ? '.vercel.app' : undefined
      },
      secret: process.env.SESSION_SECRET_DEV_PROD as string,
      saveUninitialized: false, // don't save empty sessions, right from the start
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, UserResolver, PostResolver],
      validate: false,
    }),
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    context: ({ req, res }: Context): Context => ({
      req,
      res,
      connection,
      dataLoaders: buildDataLoaders(),
    }),
  });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: false });
  const PORT = (process.env.PORT as string) || 4000;
  app.listen(PORT, () =>
    console.log(
      `Server started on port ${PORT}. Graphql server started on localhost:${PORT}${apolloServer.graphqlPath}`
    )
  );
};

main().catch((err) => console.log(err));
