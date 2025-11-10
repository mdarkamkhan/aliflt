module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("uploads");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "public/": "/" });

  eleventyConfig.addCollection("products",  api => api.getFilteredByGlob("products/*.md"));
  eleventyConfig.addCollection("services",  api => api.getFilteredByGlob("services/*.md"));
  eleventyConfig.addCollection("works",     api => api.getFilteredByGlob("works/*.md"));
  eleventyConfig.addCollection("offers",    api => api.getFilteredByGlob("offers/*.md"));

  return {
    dir: { input: "./", includes: "_includes", data: "_data", output: "_site" }
  };
};
