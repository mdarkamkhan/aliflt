const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Yahaan path ko FINAL aur SABSE RELIABLE tareeke se fix kiya gaya hai!
    // __dirname (current directory: netlify/functions/) se do steps upar jao (root /)
    const projectRoot = path.join(__dirname, '..', '..');

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Root / se content folder ka path banao (e.g., /offers)
    const contentDir = path.join(projectRoot, category);
    
    if (!fs.existsSync(contentDir)) {
      // Ab hum naya path log kar rahe hain, jisse pata chale ki woh kahan dhoondh raha hai!
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
    console.error('Final Runtime Error (Using __dirname):', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Function failed due to final path issue: ${error.message}` }),
    };
  }
};
      
