// netlify/functions/gallery.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); // Nayi library: gray-matter

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Path to the content directory (e.g., 'offers')
    const contentDir = path.join(process.cwd(), category);
    
    if (!fs.existsSync(contentDir)) {
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }

    const files = fs.readdirSync(contentDir);
    
    const galleryItems = files.map(file => {
      // Sirf .md files padhiye (CMS ki default file)
      if (file.endsWith('.md')) {
        const fullPath = path.join(contentDir, file);
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        
        // Frontmatter (CMS data) ko parse karein
        const { data } = matter(fileContent); 
        return data; // Sirf data object return hoga jismein title aur image hai
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
        
