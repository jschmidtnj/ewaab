module.exports = {
  purge: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // change to media to set based on device
  theme: {},
  variants: {
    extend: {
      backgroundColor: ['disabled'],
      borderRadius: ['first', 'last'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
