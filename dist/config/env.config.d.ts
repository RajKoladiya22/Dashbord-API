interface JwtConfig {
    secret: string;
    expiresIn: string;
}
export interface EnvConfig {
    nodeEnv: string;
    host: string;
    port: number;
    databaseUrl: string;
    apikey: string;
    saltRounds: string;
    jwt: JwtConfig;
}
export declare const envConfiguration: () => EnvConfig;
export {};
