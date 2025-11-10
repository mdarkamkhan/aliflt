// .eleventy.js
// This file configures Eleventy to build your site correctly.

module.exports = function(eleventyConfig) {
    
    // --- Passthrough Copies ---
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("uploads");
    eleventyConfig.addPassthroughCopy("admin");
    eleventyConfig.addPassthroughCopy({ "public/": "/" });

    // --- Collections ---
    
    // 💡 THIS IS THE BULLETPROOF FIX:
    // We now get files by "glob" (path) instead of by "tag".
    // This ignores all .json files and any other junk.
    eleventyConfig.addCollection("products", function(collectionApi) {
        return collectionApi.getFilteredByGlob("products/*.md");
    });
    
    eleventyConfig.addCollection("services", function(collectionApi) {
        return collectionApi.getFilteredByGlob("services/*.md");
    });

    eleventyConfig.addCollection("works", function(collectionApi) {
        return collectionApi.getFilteredByGlob("works/*.md");
    });

    eleventyConfig.addCollection("offers", function(collectionApi) {
        return collectionApi.getFilteredByGlob("offers/*.md");
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
