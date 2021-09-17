const core = require('@actions/core')
const walkSync = require('walk-sync')
const { testScenario } = require('./tests')
const { extractBodyWithMeta } = require('./utils')
const { PROTOCOLS_FOLDER } = require('./constants')

const modifiedProtocolPaths = process.argv
  .slice(2)
  .filter((p) => p.endsWith('.md'))

async function run() {
  let countErrors = 0
  try {
    const allProtocolsPaths = walkSync(PROTOCOLS_FOLDER, {
      directories: false,
      includeBasePath: true,
      globs: ['**/*.md'],
    })

    const oldProtocolsPaths = allProtocolsPaths.filter(
      (protocolPath) => !modifiedProtocolPaths.includes(protocolPath),
    )

    const [oldProtocols, newProtocols] = await Promise.all([
      extractBodyWithMeta(oldProtocolsPaths),
      extractBodyWithMeta(modifiedProtocolPaths),
    ])

    countErrors += testScenario({ newProtocols, oldProtocols, logger: core })
  } catch (e) {
    countErrors++
    core.error(e)
  }

  if (countErrors > 0) {
    core.setFailed(`Errors: ${countErrors}`)
  }
}

void run()
