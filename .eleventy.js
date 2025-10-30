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
    // We don't need to copy 'products' or 'services' folders
    // as Eleventy is processing them.

    // --- Collections ---
    // 💡 FIX: We now find items by their "tag"
    // This works with the new products/products.json file.
    eleventyConfig.addCollection("products", function(collectionApi) {
        return collectionApi.getFilteredByTag("product");
    });
    
    // We will do the same for services, works, and offers for consistency
    // (You will need to create .json files in those folders too)
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
