const levenshtien = require('damerau-levenshtein')
const github = require('@actions/github')
const path = require('path')
const {
  SLUG_PATTERN,
  VERSION_PATTERN,
  MARKDOWN_FILENAME,
  LEVENSHTIEN_TRESHOLD,
  PROTOCOLS_FOLDER,
  SITE_URL,
  SPACE_PATTERN,
  NOT_ALPHANUMERIC_PATTERN,
} = require('./constants')
const core = require('@actions/core')

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

function testAuthors(authors) {
  return (
    Array.isArray(authors) &&
    authors.every((a) => {
      return (
        typeof a === 'object' &&
        typeof a.name === 'string' &&
        (typeof a.email === 'string' || !a.email)
      )
    })
  )
}

function testMetaPiuriAndFileStructire(piuri, folders) {
  return (
    piuri.replace(SITE_URL, '').replace(NOT_ALPHANUMERIC_PATTERN, '') ===
    folders.join('').replace(NOT_ALPHANUMERIC_PATTERN, '')
  )
}

function testTitleAndProtocolFolder(title, folder) {
  return (
    title.toLocaleLowerCase().replace(SPACE_PATTERN, '') ===
    folder.replace(SPACE_PATTERN, '')
  )
}

function testTagsDuplicates(tags) {
  return tags.length === new Set(tags).size
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

function testPRAuthor(prAuthore, metaAuthor) {
  return prAuthore === metaAuthor
}

function testUniqueName(name, existingNames) {
  const formattedName = name.replace(NOT_ALPHANUMERIC_PATTERN, '')
  const formattedExistiongNames = existingNames.map((n) =>
    n.replace(NOT_ALPHANUMERIC_PATTERN, '')
  )

  const existingIndex = formattedExistiongNames.findIndex(
    (n, index) => (n === formattedName) && (name !== existingNames[index])
  )

  return {
    isUnique: existingIndex === -1,
    existing: existingNames[existingIndex],
  }
}

function testScenario({ newProtocols, oldProtocols, logger }) {
  let countErrors = 0

  if (!newProtocols.find((p) => p.path.endsWith('.md'))) {
    countErrors++
    logger.error(`Markdown file name should be equal to ${MARKDOWN_FILENAME}`)
    return countErrors
  }

  const oldTags = Array.from(
    new Set(oldProtocols.map((p) => p.matter.data.tags).flat()),
  )

  newProtocols.forEach(({ path: filePath, matter }) => {
    logger.startGroup(`Protocol path: ${filePath}.`)

    const parsedFilePath = path.parse(filePath)
    const dirs = parsedFilePath.dir.split('/').slice(3) // strip site/content/protocols

    if (!testStructure(dirs)) {
      logger.error(
        `A new protocol must be in ${PROTOCOLS_FOLDER}/<protocol_name>/<protocol_version> folder`,
      )
      countErrors++
      return countErrors
    }

    const [name, version] = dirs

    if (!testName(name)) {
      logger.error(
        'Should have correct name folder. Only letters, digits and "-" as separator allowed e.g my-cool-protocol',
      )
      countErrors++
    }

    if (!testVersion(version)) {
      logger.error('Should have correct version folder e.g 1.0')
      countErrors++
    }

    if (!testFileName(parsedFilePath.base)) {
      logger.error(
        `Markdown file name should be equal to ${MARKDOWN_FILENAME}`,
      )
      countErrors++
    }

    if (!testMetaPiuriAndFileStructire(matter.data.piuri, dirs)) {
      logger.error(
        `Part of meta field piuri should be equal to protocol file structure`,
      )
      countErrors++
    }

    if (!testAuthors(matter.data.authors)) {
      logger.error(
        `Authors should be array of objects with next fields: name is string, email is optional string`,
      )
      countErrors++
    }

    if (!testTitleAndProtocolFolder(matter.data.title, name)) {
      logger.error(
        `Meta field title should include the same letters and digits as protocol file structure`,
      )
      countErrors++
    }

    if (!testPRAuthor(matter.data.publisher, github.context.actor)) {
      logger.error(
        `Meta field publisher should be the same as Pull Request Author`,
      )
      countErrors++
    }

    const uniqueNameTestResult = testUniqueName(
      filePath,
      oldProtocols.map((p) => p.path),
    )
    if (!uniqueNameTestResult.isUnique) {
      logger.error(
        `There is protocol with similar name and version = ${uniqueNameTestResult.existing}`,
      )
      countErrors++
    }
    if (!testTagsDuplicates(matter.data.tags)) {
      logger.error(`Tags should not have duplicates`)
      countErrors++
    }

    logger.startGroup('Validate tags similarity')
    const newTags = Array.from(matter.data.tags).filter(
      (tag) => !oldTags.includes(tag),
    )

    testTagsSimilarity(oldTags, newTags).forEach((result) => {
      if (result.similars.length > 0) {
        core.warning(
          `tag: ${
            result.tag
          } is similar to existing tags: ${result.similars.join(
            ', ',
          )}. Make sure you can't use existing one.`,
        )
      }
    })
    logger.endGroup()
    logger.endGroup()
  })

  return countErrors
}

module.exports = {
  testStructure,
  testName,
  testVersion,
  testFileName,
  testTagsSimilarity,
  testScenario,
}
