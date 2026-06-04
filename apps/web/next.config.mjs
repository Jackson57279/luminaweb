/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
  // auth.ts / platform.ts and the capsule runtime use bun:sqlite + Bun.* APIs
  // and the workspace `luminaweb-runtime` package ships raw TS with .js-style
  // specifiers. Keep all of it out of the webpack bundle so it resolves at
  // runtime under `bun --bun`.
  serverExternalPackages: ["better-auth", "kysely"],
  webpack(config) {
    config.externals = config.externals || [];
    config.externals.push(({ request }, callback) => {
      if (
        request === "bun:sqlite" ||
        request === "luminaweb-runtime" ||
        request?.startsWith("luminaweb-runtime/")
      ) {
        return callback(null, "commonjs " + request);
      }
      callback();
    });
    return config;
  },
};

export default nextConfig;
