import chalk from 'chalk'

import { REGISTRIES } from './constants.js'

function padding(message = '', before = 1, after = 1) {
  return (
    new Array(before).fill(' ').join('') +
    message +
    new Array(after).fill(' ').join('')
  )
}

export function printSuccess(message) {
  console.log(chalk.bgGreenBright(padding('SUCCESS')) + ' ' + message)
}

export function printError(error) {
  console.error(chalk.bgRed(padding('ERROR')) + ' ' + chalk.red(error))
}

export function printMessages(messages) {
  for (const message of messages) {
    console.log(message)
  }
}

export function geneDashLine(message, length) {
  const finalMessage = new Array(Math.max(2, length - message.length + 2)).join(
    '-'
  )
  return padding(chalk.dim(finalMessage))
}

export async function isRegistryNotFound(name, printErr = true) {
  if (!Object.keys(REGISTRIES).includes(name)) {
    printErr && printError(`The registry '${name}' is not found.`)
    return true
  }
  return false
}

export async function isInternalRegistry(name, handle) {
  if (Object.keys(REGISTRIES).includes(name)) {
    handle && printError(`You cannot ${handle} the nrm internal registry.`)
    return true
  }
  return false
}

export function exit(error) {
  error && printError(error)
  process.exit(1)
}
