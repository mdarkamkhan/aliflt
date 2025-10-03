// netlify/functions/gallery.js

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // YAML file padhne ke liye zaroori library

// **Important:** Agar aap 'js-yaml' library use kar rahe hain,
// toh aapko apne project mein ek 'package.json' file bhi banani padegi,
// aur usme yeh library (dependency) add karna padega.

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;

    // Security Check: Sirf allowed categories hi padhiye
    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Us category folder ka path
    const contentDir = path.join(process.cwd(), category);
    
    // Check karein ki folder exist karta hai
    if (!fs.existsSync(contentDir)) {
      // Agar folder nahi mila, toh empty array wapas kar do
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }

    // Folder ke andar saari files (CMS entries) padhiye
    const files = fs.readdirSync(contentDir);
    
    const galleryItems = files.map(file => {
      // Sirf .md (Markdown) ya .yaml files hi padhiye
      if (file.endsWith('.md') || file.endsWith('.yaml') || file.endsWith('.yml')) {
        const fullPath = path.join(contentDir, file);
        const fileContent = fs.readFileSync(fullPath, 'utf8');

        // Agar .yaml file hai, toh usko parse karein
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
             return yaml.load(fileContent);
        }
        
        // Agar .md file hai (Netlify CMS ka default), toh Frontmatter se data nikaalein
        // Yeh thoda complex hota hai, isliye hum basic structure assume kar rahe hain.
        // Agar aap Markdown use kar rahe hain, toh 'gray-matter' library chahiye hogi.
        // Abhi ke liye, hum sirf YAML files ko support karte hain as simpler.
        return null;
      }
      return null;
    }).filter(item => item !== null);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(galleryItems),
    };
  } catch (error) {
    console.error('Error fetching gallery data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch gallery data' }),
    };
  }
};
        
