const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko final baar fix kiya gaya hai!
    // Content files repo ki root directory mein deploy hoti hain,
    // aur Netlify ka deploy path '/var/task/repo/' se banta hai.
    const contentDir = path.join(process.cwd(), category); 

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    if (!fs.existsSync(contentDir)) {
      // Agar contentDir nahi mila, toh Netlify ke deploy structure ko check karte hain.
      const fallbackDir = path.join(process.cwd(), '..', category);
      if (fs.existsSync(fallbackDir)) {
          // Agar backup path mil gaya, toh use karte hain
          contentDir = fallbackDir; 
      } else {
          // Agar dono path nahi mile
          return { statusCode: 200, body: JSON.stringify([]) }; 
      }
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
      body: JSON.stringify({ error: `Function failed: ${error.message}` }),
    };
  }
};
