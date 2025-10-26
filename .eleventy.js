// .eleventy.js
module.exports = function(eleventyConfig) {
    // CMS images are in /uploads, so copy the 'uploads' folder to the output directory
    eleventyConfig.addPassthroughCopy("uploads");
    
    // Copy the admin folder (CMS interface files)
    eleventyConfig.addPassthroughCopy("admin");

    // Output directory (Netlify will publish this folder)
    return {
        dir: {
            input: "./", // Look for files in the root directory
            includes: "_includes", // Look for reusable parts in the _includes folder
            data: "_data", // Look for global data in the _data folder
            output: "_site" // Publish the final site files to the _site folder
        }
    };
};
