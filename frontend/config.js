export const AUTH_CONFIG = {
  AUTH0_DOMAIN: process.env.DOMAIN,
  CLIENT_ID: process.env.CLIENT_ID,
  API_AUDIENCE: process.env.API_AUDIENCE,
  BACKEND_URL: process.env.BACKEND_URI,
  REDIRECT_URI: process.env.REDIRECT_URI,
  SCOPE: process.env.SCOPE,
  MAX_N: parseInt(process.env.MAX_N, 10),
};

// console.log(AUTH_CONFIG)