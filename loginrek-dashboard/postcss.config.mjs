// Tailwind CSS v4 dipasang lewat PostCSS. Hanya situs publik yang mengimpor Tailwind (app/globals.css);
// dashboard HR tetap memakai CSS-nya sendiri (app/dashboard/dashboard.css).
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
