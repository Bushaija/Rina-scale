import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { sendEmail } from "./email";
import { openAPI } from "better-auth/plugins";
import * as schema from "@/db/schema";
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            user: schema.users,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
        // usePlural: true,
    }),
    advanced: {
        database: {
          generateId: false,
        }
    },
    plugins: [openAPI()], // api/auth/reference
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        // BUG: Prob a bug with updateAge method. It throws an error - Argument `where` of type SessionWhereUniqueInput needs at least one of `id` arguments. 
        // As a workaround, set updateAge to a large value for now.
        updateAge: 60 * 60 * 24 * 7, // 7 days (every 7 days the session expiration is updated)
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60 // Cache duration in seconds
        }
    },
    emailVerification: {
        sendOnSignUp: true,
        // autoSignInAfterVerification: true,
        // sendVerificationEmail: async ({ user, token }) => {
        //   const verificationUrl = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${process.env.EMAIL_VERIFICATION_CALLBACK_URL}`;
        //   await sendEmail({
        //     to: user.email,
        //     subject: "Verify your email address",
        //     text: `Click the link to verify your email: ${verificationUrl}`,
        //   });
        // },
    },
    emailAndPassword: {
        enabled: true,
        // requireEmailVerification: true,
        // sendResetPassword: async ({ user, url }) => {
        //   await sendEmail({
        //     to: user.email,
        //     subject: "Reset your password",
        //     text: `Click the link to reset your password: ${url}`,
        //   });
        // },
    },
    user: {
        additionalFields: {
          facilityId: {
            type: "number",
            required: false,
            defaultValue: null,
            input: true
          },
          role: {
            type: "string",
            required: false,
          },
        },
        changeEmail: {
          enabled: true,
          sendChangeEmailVerification: async ({ newEmail, url }) => {
            await sendEmail({
              to: newEmail,
              subject: 'Verify your email change',
              text: `Click the link to verify: ${url}`
            })
          }
        }
    },
});

export type Auth = typeof auth;