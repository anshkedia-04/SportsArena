const fs = require('fs');
const babel = require('@babel/core');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.error("Could not find <script type=\"text/babel\">");
  process.exit(1);
}

const script = scriptMatch[1];
fs.writeFileSync('app.jsx', script);

try {
  const result = babel.transformSync(script, {
    presets: ['@babel/preset-react'],
    filename: 'app.jsx'
  });
  fs.writeFileSync('app.js', result.code);
  console.log("Compilation successful! Wrote app.js");
} catch (err) {
  console.error("Compilation error:");
  console.error(err.message);
  console.error(err.codeFrame);
  process.exit(1);
}
