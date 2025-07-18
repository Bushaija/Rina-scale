import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
// import type { Schema } from "hono";
import type { PinoLogger } from "hono-pino";
import { BASE_PATH } from "./constants";

export interface User {
  id: string;
  email: string;
  name: string;
  facilityId?: number;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
}

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
    user?: User;
    session?: Session;
  };
};

// eslint-disable-next-line ts/no-empty-object-type
// export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;
export type AppOpenAPI = OpenAPIHono<AppBindings, {}, typeof BASE_PATH>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;