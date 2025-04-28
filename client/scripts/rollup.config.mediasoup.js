import resolve from "@rollup/plugin-node-resolve";
import commonJS from "@rollup/plugin-commonjs";

export default [
	{
		input: "mediasoup-client",
		output: [{
			file: "libs/mediasoup-client.mjs",
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