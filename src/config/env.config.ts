import { validatedEnv } from "./validate-env";

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  databaseName: string;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface SmtpConfig {
  service: string;
  host: string;
  port: number;
  user: string;
  password: string;
}

interface AwsConfig {
  bucketName?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  cdnEndpoint?: string;
}

interface AdminConfig {
  email: string;
}

export interface EnvConfig {
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl: string;
  apikey: string;
  saltRounds: string;
  jwt: JwtConfig;
  // database: DatabaseConfig;
  // smtp: SmtpConfig;
  // aws: AwsConfig;
  // admin: AdminConfig;
}

export const envConfiguration = (): EnvConfig => ({
  nodeEnv: validatedEnv!.NODE_ENV,
  host: validatedEnv!.HOST,
  port: validatedEnv!.PORT,
  databaseUrl: validatedEnv!.DATABASE_URL,
  apikey: validatedEnv!.STATIC_TOKEN,
  saltRounds: validatedEnv!.SALT_ROUNDS,
  jwt: {
    secret: validatedEnv!.JWT_SECRET,
    expiresIn: validatedEnv!.JWT_EXPIRES_IN,
  },

  // database: {
  //   host: validatedEnv.DB_HOST,
  //   port: validatedEnv.DB_PORT,
  //   username: validatedEnv.DB_USERNAME,
  //   password: validatedEnv.DB_PASSWORD,
  //   databaseName: validatedEnv.DB_NAME,
  // },

  // smtp: {
  //   service: validatedEnv.SMTP_SERVICE,
  //   host: validatedEnv.SMTP_HOST,
  //   port: validatedEnv.SMTP_PORT,
  //   user: validatedEnv.SMTP_USER,
  //   password: validatedEnv.SMTP_PASS,
  // },

  // aws: {
  //   bucketName: validatedEnv.AWS_BUCKET_NAME,
  //   region: validatedEnv.AWS_REGION,
  //   accessKeyId: validatedEnv.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: validatedEnv.AWS_SECRET_ACCESS_KEY,
  //   endpoint: validatedEnv.AWS_ENDPOINT,
  //   cdnEndpoint: validatedEnv.CDN_ENDPOINT,
  // },

  // admin: {
  //   email: validatedEnv.ADMIN_MAIL,
  // },
});
