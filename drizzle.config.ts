import type { Config } from "drizzle-kit";

export default {
  schema: "./modules-custom/receipts/database/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
