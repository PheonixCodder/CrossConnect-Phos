import { shopifyApiProject, ApiType } from '@shopify/api-codegen-preset';
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://shopify.dev',
  // Make sure this points to your .ts files
  documents: ['./src/**/*.ts'],
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion: '2026-01',
      documents: ['./src/**/*.ts'],
      outputDir: './src/connectors/shopify/graphql/generated',
    }),
  },
};

export default config;
