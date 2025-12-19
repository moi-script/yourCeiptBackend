import 'dotenv/config'; // Load env vars once here

const config = {
    // App Settings
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    
    // Database Settings
    db: {
        uri: process.env.NODE_ENV === 'development' ?  'mongodb://localhost:27017/project' : process.env.MONGO_URI,

    },
    
    // Secrets (JWT, API Keys, etc.)
    jwtSecret: process.env.JWT_SECRET,
};

if (!config.db.uri) {
    throw new Error('FATAL ERROR: MONGO_URI is not defined in .env');
}

export default config;