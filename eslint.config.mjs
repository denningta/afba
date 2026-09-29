import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next ships flat configs, so they're used directly (wrapping
// them in FlatCompat crashes with a circular-structure error).
const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "backup/**", "next-env.d.ts"]),
]);

export default eslintConfig;
