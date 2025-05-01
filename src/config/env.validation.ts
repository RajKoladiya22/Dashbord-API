import { z } from 'zod';

const toNumber = (val: unknown) =>
  typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))
    ? Number(val)
    : undefined;

export const envSchema = z.object({
  NODE_ENV: z.enum(['local', 'development', 'production']),
  HOST: z.string(),
  PORT: z.preprocess(toNumber, z.number().default(3000)),

  // Database
  DATABASE_URL: z.string().url(),
  DB_HOST: z.string(),
  DB_PORT: z.preprocess(toNumber, z.number()),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),

  // SMTP
  SMTP_SERVICE: z.string(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.preprocess(toNumber, z.number()),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),

  // AWS (optional)
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT: z.string().optional(),
  CDN_ENDPOINT: z.string().optional(),

  // Admin
  ADMIN_MAIL: z.string().email(),

  STATIC_TOKEN: z.string(),
  SALT_ROUNDS: z.string()
});

export type EnvVars = z.infer<typeof envSchema>;
