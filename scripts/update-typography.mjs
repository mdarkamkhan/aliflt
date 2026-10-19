import fs from 'fs';
import path from 'path';

function updateCssFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace font tokens
  content = content.replace(
    /--font-heading:\s*['"]Playfair Display['"],\s*(Georgia,\s*)?serif;/g,
    "--font-heading: 'Ubuntu', sans-serif;\n    --font-editorial: 'Playfair Display', Georgia, serif;"
  );
  content = content.replace(
    /--font-body:\s*['"]Poppins['"],/g,
    "--font-body: 'Ubuntu',"
  );
  content = content.replace(
    /--font-body:\s*['"]Poppins['"],\s*sans-serif;/g,
    "--font-body: 'Ubuntu', sans-serif;"
  );

  // Replace hardcoded Poppins references
  content = content.replaceAll("'Poppins'", "'Ubuntu'");
  content = content.replaceAll('"Poppins"', '"Ubuntu"');
  content = content.replaceAll('/* Poppins */', '/* Ubuntu */');
  content = content.replaceAll('/* Poppins Regular */', '/* Ubuntu Regular */');
  content = content.replaceAll('/* Poppins Light */', '/* Ubuntu Light */');
  content = content.replaceAll('/* Clean Poppins font */', '/* Clean Ubuntu font */');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated CSS: ${filePath}`);
}

function updateDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      updateDirectory(full);
    } else if (/\.(astro|tsx|jsx|html|liquid)$/.test(full)) {
      let content = fs.readFileSync(full, 'utf-8');
      if (content.includes('Poppins')) {
        content = content.replaceAll("'Poppins'", "'Ubuntu'");
        content = content.replaceAll('"Poppins"', '"Ubuntu"');
        fs.writeFileSync(full, content, 'utf-8');
        console.log(`Updated: ${full}`);
      }
    }
  }
}

console.log('Updating typography system across all files...');
updateCssFile('public/css/style.css');
updateCssFile('src/styles/global.css');
updateCssFile('css/style.css');
updateDirectory('src/pages');
updateDirectory('src/layouts');
updateDirectory('src/components');
updateDirectory('_includes');
console.log('Typography update complete!');
