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
          primary: { value: "#137fec" },
        },
        fonts: {
          heading: { value: "'Poppins', sans-serif" },
          body: { value: "'Poppins', sans-serif" },
        },
      }),
      semanticTokens: defineSemanticTokens({
        colors: {
          background: { value: { _light: "#f6f7f8", _dark: "#101922" } },
          card: { value: { _light: "#ffffff", _dark: "#1e293b" } },
          textMain: { value: { _light: "#0d141b", _dark: "#e2e8f0" } },
          textSub: { value: { _light: "#4c739a", _dark: "#94a3b8" } },
          border: { value: { _light: "#e7edf3", _dark: "#334155" } },
          inputBg: { value: { _light: "#f8fafc", _dark: "#1e293b" } },
          inputBorder: { value: { _light: "#cfdbe7", _dark: "#475569" } },
        },
      }),
    },
  })
);
