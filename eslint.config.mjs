import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 일회성 Node 스크립트 (앱 빌드와 무관)
    "scripts/**",
  ]),
  {
    rules: {
      // next.config.ts 에서 images.unoptimized: true 로 이미지 최적화를 끄고,
      // 이미지는 Supabase Storage·YouTube 썸네일 등 외부 주소를 그대로 씁니다.
      // <Image> 로 바꿔도 얻는 것이 없어 이 규칙은 끕니다.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
