import serverless from "serverless-http";
import { createServer } from "../../dist/server/production.mjs";

export const handler = serverless(createServer());
