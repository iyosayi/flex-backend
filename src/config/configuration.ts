export default () => {
  // Validate required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = ['MONGODB_URI'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/flex',
    },
    hostaway: {
        apiKey: process.env.HOSTAWAY_API_KEY,
        apiSecret: process.env.HOSTAWAY_API_SECRET,
        apiUrl: process.env.HOSTAWAY_API_URL,
    }
    // Add more configuration sections as needed
    // api: {
    //   key: process.env.API_KEY,
    // },
    // jwt: {
    //   secret: process.env.JWT_SECRET,
    // },
  };
};
