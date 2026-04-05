import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigRules } from "@eslint/compat";

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    rules: {
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "warn",
      "no-undef": "warn"
    }
  }
];
