import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/static";

const defaultSiteUrl = "https://www.example.com";
const site = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || defaultSiteUrl;

export default defineConfig({
  site,
  output: "static",
  adapter: vercel(),
  trailingSlash: "never"
});
