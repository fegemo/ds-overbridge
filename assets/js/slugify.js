function slugify(str) {
  return str
    .replace(/\s/gi, '-')
    .toLowerCase();
}
