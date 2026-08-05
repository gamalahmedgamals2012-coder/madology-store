tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.08)",
        card: "0 14px 30px rgba(15, 23, 42, 0.07)"
      },
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        peach: "#fff7ed",
        accent: "#f97316"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 0.4s ease-out"
      }
    }
  }
};
