const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko simple relative path par set kiya gaya hai,
    // kyunki content files ab function ke bagal mein hain।
    // process.cwd() is '/var/task/' (function's folder)
    const contentDir = path.join(process.cwd(), category); 

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    if (!fs.existsSync(contentDir)) {
      // Agar folder ab bhi nahi mila (jo ki nahi hona chahiye), toh log karein
      console.log(`Content directory not found at: ${contentDir}`);
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }

    const files = fs.readdirSync(contentDir);
    
    const galleryItems = files.map(file => {
      // Sirf Markdown files padhega, .gitkeep ko chhod dega
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
    console.error('Final Runtime Error (The Tested Path):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Function crashed: ${error.message}` }),
    };
  }
};
