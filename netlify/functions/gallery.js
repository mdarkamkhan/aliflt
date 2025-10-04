const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko final aur sabse stable tareeke se set kiya gaya hai!
    // LAMBDA_TASK_ROOT Netlify ka function folder hai, isliye hum do steps upar jaate hain.
    const rootDir = path.join(process.env.LAMBDA_TASK_ROOT, '..', '..');

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Is path mein hi aapka data (offers/, products/) maujood hota hai
    const contentDir = path.join(rootDir, category); 
    
    if (!fs.existsSync(contentDir)) {
      // Agar contentDir nahi mila, toh empty array bhejte hain
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
    console.error('Final Runtime Error (LAMBDA PATH):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Function failed due to path issue: ${error.message}` }),
    };
  }
};
