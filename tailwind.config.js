/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3A86FF",
        secondary: "#FF006E",
        dark: "#1E1E2F",
        light: "#F4F4F8",
        success: "#06D6A0",
      },
      fontFamily: {
        "poppins": ["Poppins"],
        "inter": ["Inter"],
      },
    },
  },
  plugins: [],
};

