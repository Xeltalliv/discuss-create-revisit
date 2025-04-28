import resolve from "@rollup/plugin-node-resolve";
import commonJS from "@rollup/plugin-commonjs";

export default [
	{
		input: "src/main.mjs",
		output: [{
			file: "../server/static/js.mjs",
			format: "es",
		}],
		plugins: [
			resolve({
				browser: true,
				preferBuiltins: false
			}),
			commonJS({
				include: ["node_modules/**", "config.js"]
			}),
		]
	}
];