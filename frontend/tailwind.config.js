/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 45px rgba(23, 23, 42, 0.14)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at 15% 10%, rgba(255, 214, 165, 0.85) 0%, transparent 40%), radial-gradient(circle at 85% 20%, rgba(202, 255, 191, 0.8) 0%, transparent 34%), linear-gradient(150deg, #fff8ec 0%, #ffe3d4 48%, #f8d9ff 100%)",
      },
    },
  },
  plugins: [],
};
