// .eleventy.js
// This file configures Eleventy to build your site correctly.

module.exports = function(eleventyConfig) {
    
    // --- Passthrough Copies ---
    // These folders are copied as-is
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("uploads");
    eleventyConfig.addPassthroughCopy("admin");
    eleventyConfig.addPassthroughCopy({ "public/": "/" });

    // 💡 THE FIX:
    // Tell Eleventy to NOT process the .md files in /services/ as pages.
    // This stops the permalink conflict.
    eleventyConfig.ignoring.add("services/**/*.md");
    eleventyConfig.ignoring.add("products/**/*.md");
    eleventyConfig.ignoring.add("works/**/*.md");
    eleventyConfig.ignoring.add("offers/**/*.md");

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
