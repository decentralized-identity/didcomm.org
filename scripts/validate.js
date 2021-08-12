const core = require('@actions/core')
const walkSync = require('walk-sync')
const { testTagsSimilarity, testPIURI } = require('./tests')
const { extractTags } = require('./utils')
const { PROTOCOLS_FOLDER } = require('./constants')

const modifiedProtocolPaths = process.argv.slice(2)

async function run() {
  let countErrors = 0
  try {
    const allProtocolsPaths = walkSync(PROTOCOLS_FOLDER, {
      directories: false,
      includeBasePath: true,
    })

    const oldProtocolsPaths = allProtocolsPaths.filter(
      (protocolPath) => !modifiedProtocolPaths.includes(protocolPath),
    )

    core.startGroup('Validate PIURI')
    countErrors += testPIURI(modifiedProtocolPaths, core)
    core.endGroup()

    core.startGroup('Validate tags similarity')
    const [oldTags, protocolTags] = await Promise.all([
      extractTags(oldProtocolsPaths),
      extractTags(modifiedProtocolPaths),
    ])
    const newTags = protocolTags.filter((tag) => !oldTags.includes(tag))

    testTagsSimilarity(oldTags, newTags).forEach((result) => {
      if (result.similars.length > 0) {
        core.warning(
          `tag: ${
            result.tag
          } is similar to existing tags: ${result.similars.join(
            ', ',
          )}. Make sure you can't use existing one.`)
      }
    })

    core.endGroup()
  } catch (e) {
    countErrors++
    core.error(e)
  }

  if (countErrors > 0) {
    core.setFailed(`Errors: ${countErrors}`)
  }
}

run()
