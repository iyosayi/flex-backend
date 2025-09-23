export default () => {
  // Validate DATA_BACKEND environment variable
  const dataBackend = process.env.DATA_BACKEND || 'mock';
  if (!['mock', 'mongo'].includes(dataBackend)) {
    throw new Error(`Invalid DATA_BACKEND value: ${dataBackend}. Must be 'mock' or 'mongo'`);
  }

  // Validate required environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = dataBackend === 'mongo' ? ['MONGODB_URI'] : [];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return {
    port: parseInt(process.env.PORT, 10) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    dataBackend,
    database: {
      mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/flex',
    },
    hostaway: {
        apiKey: process.env.HOSTAWAY_API_KEY,
        apiSecret: process.env.HOSTAWAY_API_SECRET,
        apiUrl: process.env.HOSTAWAY_API_URL,
    }
  };
};
