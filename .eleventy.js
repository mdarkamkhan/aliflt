// .eleventy.js
module.exports = function(eleventyConfig) {
    
    // --- Passthrough Copies ---
    // 💡 CRITICAL FIX: Add the CSS folder so the site can be styled
    eleventyConfig.addPassthroughCopy("css"); 
    
    eleventyConfig.addPassthroughCopy("uploads");
    eleventyConfig.addPassthroughCopy("admin");

    // We can remove this line as we standardized to .liquid files:
    // htmlTemplateEngine: "liquid",

    return {
        dir: {
            input: "./", 
            includes: "_includes", 
            data: "_data", 
            output: "_site" 
        }
    };
};
