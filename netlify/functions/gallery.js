const fs = require('fs');
// const path = require('path'); // Isko hata dete hain!
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko final, simple relative path par set kiya gaya hai!
    // Netlify mein yeh function folder ke andar dekhega।
    const contentDir = `./${category}`; 

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    if (!fs.existsSync(contentDir)) {
      // Content nahi mila, toh safe exit
      console.log(`Content directory not found at: ${contentDir}`);
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }

    const files = fs.readdirSync(contentDir);
    
    const galleryItems = files.map(file => {
      if (file.endsWith('.md')) { 
        const fullPath = `${contentDir}/${file}`; // Simple string pathing
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
    console.error('Final Runtime Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Function crashed: ${error.message}` }),
    };
  }
};
