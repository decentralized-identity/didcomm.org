const { readFile } = require('fs/promises')
const matter = require('gray-matter')

async function extractTags(paths) {
  const contents = await Promise.all(paths.map((path) => readFile(path)))

  const tagsSet = contents.reduce((tags, content) => {
    const curTags = matter(content).data?.tags ?? []
    curTags.forEach((tag) => tags.add(tag))
    return tags
  }, new Set())

  return Array.from(tagsSet)
}

module.exports = {
  extractTags,
}
