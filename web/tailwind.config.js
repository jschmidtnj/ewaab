module.exports = {
  purge: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'media', // 'media' or 'class'
  theme: {},
  variants: {
    extend: {
      backgroundColor: ['disabled'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
