import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineSemanticTokens,
  defineTokens,
} from "@chakra-ui/react";

export const system = createSystem(
  defaultConfig,
  defineConfig({
    theme: {
      tokens: defineTokens({
        colors: {
          primary: { value: "#4F7C6B" },
          amber: { value: "#E8A33D" },
          sage: { value: "#4F7C6B" },
          sageDark: { value: "#3C6053" },
          ink: { value: "#151A21" },
          inkSoft: { value: "#1E252F" },
          paper: { value: "#EFF1EC" },
        },
        fonts: {
          heading: { value: "'Inter', sans-serif" },
          body: { value: "'Inter', sans-serif" },
        },
      }),
      semanticTokens: defineSemanticTokens({
        colors: {
          background: { value: { _light: "#EFF1EC", _dark: "#EFF1EC" } },
          card: { value: { _light: "#ffffff", _dark: "#ffffff" } },
          textMain: { value: { _light: "#151A21", _dark: "#151A21" } },
          textSub: { value: { _light: "#5B6675", _dark: "#5B6675" } },
          border: { value: { _light: "#D7DBE1", _dark: "#D7DBE1" } },
          inputBg: { value: { _light: "#ffffff", _dark: "#ffffff" } },
          inputBorder: { value: { _light: "#D7DBE1", _dark: "#D7DBE1" } },
        },
      }),
      recipes: {
        button: {
          base: {
            _focus: { outline: "none", boxShadow: "none" },
            _focusVisible: { outline: "none", boxShadow: "none" },
          },
        },
      },
    },
  })
);
