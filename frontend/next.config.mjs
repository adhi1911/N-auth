/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DOMAIN: process.env.DOMAIN,
    API_AUDIENCE: process.env.API_AUDIENCE,
    CLIENT_ID: process.env.CLIENT_ID,
    BACKEND_URI: process.env.BACKEND_URI,
    FRONTEND_URI: process.env.FRONTEND_URI,
    REDIRECT_URI: process.env.REDIRECT_URI,
    SCOPE: process.env.SCOPE,
    MAX_N: process.env.MAX_N
  }
}

export default nextConfig