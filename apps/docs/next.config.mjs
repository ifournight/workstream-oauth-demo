import nextra from "nextra";

const withNextra = nextra({});

// Get environment variables with fallbacks
const getEnvVar = (name, fallback) => process.env[name] || fallback;

export default withNextra({
  i18n: {
    locales: ["en", "zh-CN"],
    defaultLocale: "en",
  },
  // Expose environment variables to the client
  env: {
    NEXT_PUBLIC_DEMO_URL: getEnvVar('DEMO_URL', getEnvVar('NEXT_PUBLIC_DEMO_URL', 'https://your-demo-app.vercel.app')),
    NEXT_PUBLIC_UMS_BASE_URL: getEnvVar('UMS_BASE_URL', getEnvVar('NEXT_PUBLIC_UMS_BASE_URL', 'https://ums.example.com')),
    NEXT_PUBLIC_PUBLIC_API_URL: getEnvVar('PUBLIC_API_URL', getEnvVar('NEXT_PUBLIC_PUBLIC_API_URL', 'https://api.workstream.is')),
  },
});