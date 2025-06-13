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
export interface EnvConfig {
    nodeEnv: string;
    host: string;
    port: number;
    databaseUrl: string;
    apikey: string;
    saltRounds: string;
    jwt: JwtConfig;
    smtp: SmtpConfig;
}
export declare const envConfiguration: () => EnvConfig;
export {};
