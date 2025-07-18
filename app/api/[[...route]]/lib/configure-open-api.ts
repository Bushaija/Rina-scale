import { Scalar } from "@scalar/hono-api-reference";

import type { AppOpenAPI } from "../lib/types";
import { BASE_PATH } from "./constants";


export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Budget Monitoring API",
    },
  });

  app.get(
    "/reference",
    Scalar({
      url: `${BASE_PATH}/doc`,
      theme: "kepler",
      layout: "classic",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch",
      },
    }),
  );
}