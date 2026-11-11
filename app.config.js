// The web version can be published under a sub-path (GitHub Pages): set WEB_BASE when exporting.
module.exports = ({ config }) => (process.env.WEB_BASE
  ? { ...config, experiments: { ...(config.experiments || {}), baseUrl: process.env.WEB_BASE } }
  : config);
