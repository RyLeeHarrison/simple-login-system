import "reflect-metadata";
import Express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";

import { resolvers } from "./modules/resolvers";
import { authMiddleware, authChecker } from "./helpers/auth";

const main = async () => {
  const httpPort = 3001;

  // Connect to Postgres DB
  const connect = () => new Promise((resolve, reject) => {
    let attempts = 0, maxAttempts = 10;
    const interval = setInterval(() => createConnection()
      .then(() => { clearInterval(interval); resolve(); })
      .catch(error => attempts > maxAttempts ? reject(error) : attempts++), 500);
  });
  await connect();

  // Generate TypeGraphQL Schema 
  const schema = await buildSchema({
    resolvers,
    authChecker,
    emitSchemaFile: {
      path: "../common/schema.graphql"
    }
  });

  // Create GraphQL Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res })
  });

  // Create Express Web Server
  const app = Express();

  // Read authentication cookies from requests
  app.use(cookieParser())

  // Limit the origin of requests
  app.use(cors({
    credentials: true,
    origin: ["http://localhost:3000"]
  }))

  // Configure JWT-Authentication
  app.use(authMiddleware);

  // Integrate GraphQL Server with Express
  apolloServer.applyMiddleware({ app });

  app.listen(httpPort, () => console.log(`
  > GraphQL: http://localhost:${httpPort}/graphql
  
  > pgAdmin: http://localhost:5050
       - email: admin@local.host
       - password: postgres

  >  postgres: 
       - username: postgres
       - password: postgres
  `));
}

main(); 