// central env manager to prevent leaking secrets to client
const isServer = typeof window === 'undefined';

const serverEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  API_RATE_LIMIT: process.env.API_RATE_LIMIT,
};

const clientEnv = {
  // Public client-safe environment variables can go here
};

// Validate environment variables on the server side
if (isServer) {
  const missing = [];
  
  if (!serverEnv.MONGODB_URI) missing.push('MONGODB_URI');
  if (!serverEnv.DATABASE_URL) missing.push('DATABASE_URL');
  if (!serverEnv.JWT_SECRET) missing.push('JWT_SECRET');
  if (!serverEnv.API_RATE_LIMIT) missing.push('API_RATE_LIMIT');

  if (missing.length > 0) {
    const errorMsg = `❌ Missing critical environment variables on the server: ${missing.join(', ')}. Please configure them in your .env file.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

// Proxied env object to protect server secrets from accidental client leaks
export const env = new Proxy(
  {
    ...clientEnv,
    ...(isServer ? serverEnv : {}),
  },
  {
    get(target, prop) {
      if (!isServer && prop in serverEnv) {
        throw new Error(
          `❌ Attempted to access server-side environment variable '${String(prop)}' on the client. ` +
          `Secrets must only be accessed in server-side functions (e.g. API routes, getServerSideProps, or Server Components).`
        );
      }
      return target[prop];
    },
  }
);
