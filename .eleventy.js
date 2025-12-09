module.exports = function(eleventyConfig) {
  
  // 1. Files Copy Karna
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("uploads");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("icons"); // Icons folder copy karein

  // 💡 PWA FILES (Root se copy karein)
  eleventyConfig.addPassthroughCopy("manifest.webmanifest");
  eleventyConfig.addPassthroughCopy("sw.js");

  // 2. Collections Banana
  eleventyConfig.addCollection("products",  api => api.getFilteredByGlob("products/*.md"));
  eleventyConfig.addCollection("services",  api => api.getFilteredByGlob("services/*.md"));
  eleventyConfig.addCollection("works",     api => api.getFilteredByGlob("works/*.md"));
  eleventyConfig.addCollection("offers",    api => api.getFilteredByGlob("offers/*.md"));
  
  // 💡 FIX: Name must be "designs" (Plural) to match your templates
  eleventyConfig.addCollection("designs",   api => api.getFilteredByGlob("designs/*.md"));

  // 3. 🔥 MAGIC FIX: FORCE URL GENERATION 🔥
  eleventyConfig.addGlobalData("eleventyComputed", {
    permalink: (data) => {
      if (data.permalink && data.permalink !== false) return data.permalink;

      if (data.page.filePathStem.startsWith('/designs/')) {
        return "design/{{ page.fileSlug }}/"; // Single design URL
      }
      if (data.page.filePathStem.startsWith('/products/')) {
        return "products/{{ page.fileSlug }}/";
      }
      if (data.page.filePathStem.startsWith('/services/')) {
        return "service/{{ page.fileSlug }}/";
      }
      if (data.page.filePathStem.startsWith('/works/')) {
        return "works/{{ page.fileSlug }}/";
      }

      return data.permalink;
    }
  });

  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" }
  };
};
