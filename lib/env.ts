// lib/env.ts
function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  NEXTAUTH_URL: getEnv("NEXTAUTH_URL", "http://localhost:3000"),
  NEXTAUTH_SECRET: getEnv("NEXTAUTH_SECRET"),
  APP_NAME: getEnv("APP_NAME", "Smart Atelier"),
  APP_ENV: getEnv("APP_ENV", "development"),

  SEED_ADMIN_NAME: getEnv("SEED_ADMIN_NAME", "Super Admin"),
  SEED_ADMIN_EMAIL: getEnv("SEED_ADMIN_EMAIL", "admin@mwinda.cd"),
  SEED_ADMIN_PASSWORD: getEnv("SEED_ADMIN_PASSWORD", "123456"),

  UPLOAD_DIR: getEnv("UPLOAD_DIR", "./public/uploads"),
};