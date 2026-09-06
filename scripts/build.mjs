// Inlines src/core.js into src/index.html and writes dist/index.html.
// The Claude artifact host blocks same-origin script files, so it gets the single-file build.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('src/index.html', 'utf8');
const core = readFileSync('src/core.js', 'utf8');
const tag = '<script src="core.js"></script>';
if (!html.includes(tag)) throw new Error('core.js script tag not found in src/index.html');
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', html.replace(tag, '<script>\n' + core + '\n</script>'));
console.log('dist/index.html written');
