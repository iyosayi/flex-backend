export interface DatabaseConfig {
  mongodbUri: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
}

// Extend this interface as you add more configuration sections
// export interface ApiConfig {
//   key: string;
// }

// export interface JwtConfig {
//   secret: string;
// }
