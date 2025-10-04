const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko final baar fix kiya gaya hai!
    // Netlify mein content files /var/task/ ke bahar hoti hain।
    // Hum function folder se do steps upar jaakar content folder tak pahunchenge।
    const rootPath = path.join(process.cwd(), '..', '..');

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Ab contentDir ko content folder se jodo
    const contentDir = path.join(rootPath, category);
    
    if (!fs.existsSync(contentDir)) {
      console.log(`Content directory not found at: ${contentDir}`);
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
    console.error('Final Runtime Error (Check new path):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Function failed due to path issue: ${error.message}` }),
    };
  }
};
  
