import fs from 'fs';

const files = fs.readdirSync('src/content/designs');
files.forEach(f => {
  const c = fs.readFileSync('src/content/designs/' + f, 'utf8');
  const title = (c.match(/title:\s*["']?([^"'\r\n]+)/) || [])[1];
  const img = (c.match(/image:\s*["']?([^"'\r\n]+)/) || [])[1];
  const cat = (c.match(/category:\s*["']?([^"'\r\n]+)/) || [])[1];
  console.log(f, '|', title, '|', cat, '|', img);
});
