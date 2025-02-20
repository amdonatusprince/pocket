export const config = {
  app: {
    name: "Pocket Finance",
    description: "One agent, all things payment",
  },
  env: {
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  },
  features: {
    auth: true,
    darkMode: true,
  },
};

export default config; 