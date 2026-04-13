// lib/app-config.ts
import { env } from "@/lib/env";

export const appConfig = {
  name: env.APP_NAME,
  env: env.APP_ENV,
  company: "Mwinda Industrie",
  defaultAdminEmail: env.SEED_ADMIN_EMAIL,
};