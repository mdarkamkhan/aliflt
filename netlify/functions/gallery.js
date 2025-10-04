const fs = require('fs');
const path = require('path'); // <--- Yeh line daalni hai!
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    // Path fix: Function folder se do steps upar jao (root /)
    const projectRoot = path.join(__dirname, '..', '..');

    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Root / se content folder ka path banao (e.g., /offers)
    const contentDir = path.join(projectRoot, category);
    
    if (!fs.existsSync(contentDir)) {
      console.log(`Content directory not found at: ${contentDir}`);
      return { statusCode: 200, body: JSON.stringify([]) }; 
    }
    // ... rest of the code for reading files ...

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
    console.error('Final Runtime Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Final Function Crash: ${error.message}` }),
    };
  }
};
        
