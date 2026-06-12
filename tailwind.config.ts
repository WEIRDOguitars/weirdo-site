import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#050505",
        surface: "#0c0c0c",
        muted: "#b5aea0",
        gold: "#d6a74f",
        goldSoft: "#f7dd97"
      },
      boxShadow: {
        glow: "0 0 120px rgba(214, 167, 79, 0.16)"
      },
      backgroundImage: {
        "mesh-radial":
          "radial-gradient(circle at top, rgba(214,167,79,0.24), transparent 30%), radial-gradient(circle at 80% 10%, rgba(247,221,151,0.12), transparent 22%), linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0))"
      }
    }
  },
  plugins: []
};

export default config;
