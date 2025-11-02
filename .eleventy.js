// .eleventy.js
// This file configures Eleventy to build your site correctly.

module.exports = function(eleventyConfig) {
    
    // --- Passthrough Copies ---
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("uploads");
    eleventyConfig.addPassthroughCopy("admin");
    eleventyConfig.addPassthroughCopy("favicon.png");
    
    // 💡 NEW: Add these two lines for the PWA files
    eleventyConfig.addPassthroughCopy("manifest.webmanifest");
    eleventyConfig.addPassthroughCopy("sw.js");

    // --- Collections ---
    eleventyConfig.addCollection("products", function(collectionApi) {
        return collectionApi.getFilteredByTag("product");
    });
    
    eleventyConfig.addCollection("services", function(collectionApi) {
        return collectionApi.getFilteredByTag("service");
    });
    eleventyConfig.addCollection("works", function(collectionApi) {
        return collectionApi.getFilteredByTag("work");
    });
    eleventyConfig.addCollection("offers", function(collectionApi) {
        return collectionApi.getFilteredByTag("offer");
    });

    return {
        // These settings match your current directory structure
        dir: {
            input: "./", 
            includes: "_includes", 
            data: "_data", 
            output: "_site" 
        }
    };
};
