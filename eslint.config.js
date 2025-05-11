import js from "@eslint/js"
import globals from "globals"
import { defineConfig } from "eslint/config"
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
		ignores: [
			"**/node_modules/**",
			"**/dist/**",
			"**/vendors/**",
			"**/tests/**"
		]
	},
  {
		files: ["**/*.{js,mjs,cjs}"],
		plugins: { js },
		extends: ["js/recommended"],
		rules: {
			'no-tabs': 'off',
			'brace-style': 'off',
			'comma-dangle': [
				'error',
				'only-multiline'
			],
			'no-unused-vars': [
				'error', {
					'argsIgnorePattern': '^_'
				}
			]
		}
	},
	{
		files: ["**/*.ts"],
		plugins: {
			"@typescript-eslint": tseslint.plugin
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true
			}
		},
		rules: {
			...tseslint.configs.recommended.rules,
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					'argsIgnorePattern': '^_'
				}
			]
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.node, ...globals.browser
			}
		}
	}
])

