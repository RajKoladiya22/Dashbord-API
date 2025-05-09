export declare const validatedEnv: {
    SALT_ROUNDS: string;
    NODE_ENV: "development" | "local" | "production";
    DATABASE_URL: string;
    HOST: string;
    PORT: number;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    SMTP_SERVICE: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    ADMIN_MAIL: string;
    STATIC_TOKEN: string;
    AWS_BUCKET_NAME?: string | undefined;
    AWS_REGION?: string | undefined;
    AWS_ACCESS_KEY_ID?: string | undefined;
    AWS_SECRET_ACCESS_KEY?: string | undefined;
    AWS_ENDPOINT?: string | undefined;
    CDN_ENDPOINT?: string | undefined;
};
