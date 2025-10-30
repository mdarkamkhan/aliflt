// .eleventy.js
// This file configures Eleventy to build your site correctly.

module.exports = function(eleventyConfig) {
    
    // --- Passthrough Copies ---
    // These folders and files will be copied directly to the output folder (_site)
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js"); 
    eleventyConfig.addPassthroughCopy("uploads");
    eleventyConfig.addPassthroughCopy("admin");
    eleventyConfig.addPassthroughCopy("favicon.png"); 

    // --- 💡 COLLECTIONS (This is the critical part) ---
    // This tells Eleventy to create "collections" of content.
    // The new product.liquid file NEEDS these to exist.
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
