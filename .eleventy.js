// .eleventy.js
// This file configures Eleventy to build your site correctly.

module.exports = function(eleventyConfig) {
    
    // --- Passthrough Copies ---
    // These folders are copied as-is
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("uploads");
    eleventyConfig.addPassthroughCopy("admin");
    
    // 💡 NEW, ROBUST PWA/STATIC FILE HANDLING:
    // This copies everything from "public/" to the root of the site (e.g., "public/favicon.png" becomes "/favicon.png")
    eleventyConfig.addPassthroughCopy({ "public/": "/" });
    
    // 💡 We no longer need the old, broken passthrough lines for favicon, sw.js, etc.

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
