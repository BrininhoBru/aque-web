// NOTE: Angular's build system (@angular/build:application) only reads
// postcss.config.json or .postcssrc.json — this .mjs file is NOT used.
// The active PostCSS config is postcss.config.json.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
