const fs = require('fs');
// const path = require('path'); <--- Path module hata diya
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko simple string se fix kiya gaya hai!
    // Netlify Functions mein content files ka path /var/task/ ke bagal mein hota hai
    const contentDir = `./${category}`; // Simple relative path

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    if (!fs.existsSync(contentDir)) {
      // Agar simple path se nahi mila, toh empty array return kar do
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }

    const files = fs.readdirSync(contentDir);
    
    const galleryItems = files.map(file => {
      if (file.endsWith('.md')) { 
        const fullPath = `${contentDir}/${file}`; // Simple string path
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
      body: JSON.stringify({ error: `Function failed due to final path issue: ${error.message}` }),
    };
  }
};
