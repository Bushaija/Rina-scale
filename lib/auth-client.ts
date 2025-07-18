import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { inferAdditionalFields  } from "better-auth/client/plugins";

export const authClient =  createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
        inferAdditionalFields({
            user: {
                facilityId: {
                    type: "number",
                    required: false,
                }
            }
        })
    ]
});