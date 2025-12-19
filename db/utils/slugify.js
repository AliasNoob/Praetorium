const slugify = () => {
  let version = process.env.VERSION;

  // Fallback: read from package.json or use 'unknown'
  if (!version) {
    try {
      const pkg = require('../../package.json');
      version = pkg.version || 'unknown';
    } catch {
      version = 'unknown';
    }
  }

  const slug = `db-${version.replace(/\./g, '')}-backup.sqlite`;
  return slug;
};

const parseSlug = (slug) => {
  const parts = slug.split('-');
  const version = {
    raw: parts[1],
    parsed: parts[1].split('').join('.'),
  };
  return version;
};

module.exports = {
  slugify,
  parseSlug,
};
