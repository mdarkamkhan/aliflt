// .eleventy.js
module.exports = function(eleventyConfig) {
    // CMS images are in /uploads, so copy the 'uploads' folder to the output directory
    eleventyConfig.addPassthroughCopy("uploads");
    
    // Copy the admin folder (CMS interface files)
    eleventyConfig.addPassthroughCopy("admin");

    // Output directory (Netlify will publish this folder)
    return {
        // 👇 ADD THIS LINE (or ensure this is present)
        htmlTemplateEngine: "liquid",

        dir: {
            input: "./", 
            includes: "_includes", 
            data: "_data", 
            output: "_site" 
        }
    };
};
