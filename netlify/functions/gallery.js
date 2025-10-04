const fs = require('fs');
const path = require('path');
const matter = require('gray-matter'); 

exports.handler = async (event, context) => {
  try {
    const { category } = event.queryStringParameters;
    
    const allowedCategories = ['offers', 'products', 'service', 'works']; 
    if (!allowedCategories.includes(category)) {
      return { statusCode: 400, body: 'Invalid category' };
    }

    // Possible paths Netlify might use for content (most common first)
    const possiblePaths = [
      // 1. Common Netlify deploy path from root
      path.join(__dirname, '..', '..', category), 
      // 2. LAMBDA_TASK_ROOT path (which we tried before)
      path.join(process.env.LAMBDA_TASK_ROOT, '..', '..', category),
      // 3. Simple relative path (which we tried before)
      path.join(process.cwd(), category),
      // 4. Fallback path used in some environments
      path.join('/', 'var', 'task', category) 
    ];

    let contentDir = null;

    // Har path par check karte hain
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        contentDir = testPath;
        break; // Sahi path mil gaya, ruk jao
      }
    }

    if (!contentDir) {
      console.log(`Content directory not found for ${category} in any common path.`);
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
    console.error('Ultimate Path Check Runtime Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Final Function Crash: ${error.message}` }),
    };
  }
};
  
