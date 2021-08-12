const levenshtien = require('damerau-levenshtein')
const path = require('path')
const {
  SLUG_PATTERN,
  VERSION_PATTERN,
  MARKDOWN_FILENAME,
  LEVENSHTIEN_TRESHOLD,
} = require('./constants')

function testStructure(dirs) {
  return dirs.length === 2
}

function testName(name) {
  return SLUG_PATTERN.test(name)
}

function testVersion(version) {
  return VERSION_PATTERN.test(version)
}

function testFileName(fileName) {
  return fileName === MARKDOWN_FILENAME
}

function testTagsSimilarity(oldTags, newTags) {
  const result = []
  newTags.forEach((newTag) => {
    const tagResult = { tag: newTag, similars: [] }
    oldTags.forEach((oldTag) => {
      const levenshtienResult = levenshtien(newTag, oldTag)
      if (levenshtienResult.similarity > LEVENSHTIEN_TRESHOLD) {
        tagResult.similars.push(oldTag)
      }
    })
    result.push(tagResult)
  })

  return result
}

function testPIURI(changedFilePaths, logger) {
  let countErrors = 0
  changedFilePaths.forEach((filePath) => {
    logger.info(`filePath: ${filePath}`)

    const parsedFilePath = path.parse(filePath)
    const dirs = parsedFilePath.dir.split('/').slice(3) // strip site/content/protocols
    const [name, version] = dirs

    if (!testStructure(dirs)) {
      logger.error('should have correct path')
      countErrors++
    }

    if (!testName(name)) {
      logger.error('should have correct name folder')
      countErrors++
    }

    if (!testVersion(version)) {
      logger.error('should have correct verstion folder')
      countErrors++
    }

    if (!testFileName(parsedFilePath.base)) {
      logger.error(
        'should have correct markdowm file name ' + parsedFilePath.base,
      )
      countErrors++
    }
  })

  return countErrors
}

module.exports = {
  testStructure,
  testName,
  testVersion,
  testFileName,
  testTagsSimilarity,
  testPIURI,
}
