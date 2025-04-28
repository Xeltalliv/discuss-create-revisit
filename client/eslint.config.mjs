import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([{
	"languageOptions": {
		"globals": globals.browser,
		"ecmaVersion": "latest",
		"sourceType": "module",
	},
	"plugins": { js },
	"extends": ["js/recommended"],
	"rules": {
		"indent": ["error", "tab", {
			"ignoreComments": true,
		}],
		"linebreak-style": ["error", "unix"],
		"quotes": ["error", "double"],
		"semi": ["error", "always"],
		"no-unused-vars": ["error", {
			"argsIgnorePattern": "^_",
			"varsIgnorePattern": "^_",
			"caughtErrorsIgnorePattern": "^_",
		}],
	},
}]);
