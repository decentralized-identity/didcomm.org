const levenshtien = require('damerau-levenshtein')
const path = require('path')
const {
  SLUG_PATTERN,
  VERSION_PATTERN,
  MARKDOWN_FILENAME,
  LEVENSHTIEN_TRESHOLD,
  PROTOCOLS_FOLDER,
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
    

    if (!testStructure(dirs)) {
      logger.error(`A new protocol must be in ${PROTOCOLS_FOLDER}/<protocol_name>/<protocol_version> folder`)
      countErrors++
      return countErrors
    }
    
    const [name, version] = dirs

    if (!testName(name)) {
      logger.error('Should have correct name folder. Only letters, digits and "-" as separator allowed e.g my-cool-protocol')
      countErrors++
    }

    if (!testVersion(version)) {
      logger.error('Should have correct version folder e.g 1.0')
      countErrors++
    }

    if (parsedFilePath.ext === 'md' && !testFileName(parsedFilePath.base)) {
      logger.error(`Markdown file name should be equal to ${MARKDOWN_FILENAME}`)
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
