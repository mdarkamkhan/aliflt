const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path fix kiya gaya hai:
    // Netlify functions root level se shuru nahi hote, isliye hum ek step upar jaate hain
    const rootDir = path.join(process.cwd(), '..'); 

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Ab contentDir ko rootDir se jodte hain
    const contentDir = path.join(rootDir, 'repo', category); 
    
    if (!fs.existsSync(contentDir)) {
      console.log(`Content directory not found: ${contentDir}`);
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }

    const files = fs.readdirSync(contentDir);
    
    const galleryItems = files.map(file => {
      if (file.endsWith('.md')) { 
        const fullPath = path.join(contentDir, file);
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        
        const { data } = matter(fileContent); 
        return data; 
      }
      return null;
    }).filter(item => item !== null);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(galleryItems), 
    };
  } catch (error) {
    // Log the error for troubleshooting
    console.error('Final Runtime Error (Check new path):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Function failed due to final path issue.' }),
    };
  }
};
