#!/usr/bin/env node

import { copyFile, mkdir, unlink } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const defaultOutputDir = '/tmp/tolaria-mobile-ui-simulator'

function printHelp() {
  console.log(`Capture the current iOS Simulator screen for mobile UI QA.

Usage:
  node apps/mobile/scripts/capture-ios-simulator.mjs [options]

Options:
  --device <udid>       Simulator UDID. Defaults to MOBILE_QA_SIMULATOR_UDID, then the booted iPad.
  --dir <path>          Output directory. Defaults to MOBILE_QA_SIMULATOR_SCREENSHOT_DIR or ${defaultOutputDir}.
  --out <path>          Output PNG path. Defaults to <dir>/ipad-landscape.png.
  --landscape           Rotate the artifact to landscape when the simulator returns portrait pixels.
  --open-url <url>      Open a URL in the simulator before capturing, useful for Mobile Safari QA.
  --wait <ms>           Delay after opening a URL and before capture. Defaults to 3000.
  --help                Show this help.
`)
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name)
  if (index === -1) {
    return fallback
  }
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`
    throw new Error(`${command} ${args.join(' ')} failed: ${detail}`)
  }
  return result.stdout
}

function listBootedDevices() {
  const json = run('xcrun', ['simctl', 'list', 'devices', 'booted', '--json'])
  const parsed = JSON.parse(json)
  return Object.values(parsed.devices ?? {}).flat()
}

function selectDevice(requestedDevice) {
  if (requestedDevice) {
    return requestedDevice
  }

  const bootedDevices = listBootedDevices()
  const iPad = bootedDevices.find((device) => device.name?.toLowerCase().includes('ipad'))
  const selected = iPad ?? bootedDevices[0]
  if (!selected?.udid) {
    throw new Error('No booted iOS Simulator found. Start one with `pnpm mobile:ios` first.')
  }
  return selected.udid
}

function imageDimensions(path) {
  const output = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', path])
  const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1])
  const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1])
  if (!width || !height) {
    throw new Error(`Unable to read image dimensions for ${path}`)
  }
  return { height, width }
}

async function normalizeLandscape(sourcePath, targetPath, shouldNormalize) {
  if (!shouldNormalize) {
    await copyFile(sourcePath, targetPath)
    return
  }

  const { height, width } = imageDimensions(sourcePath)
  if (width >= height) {
    await copyFile(sourcePath, targetPath)
    return
  }

  run('sips', ['-r', '90', sourcePath, '--out', targetPath])
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    printHelp()
    return
  }

  const device = selectDevice(readOption(args, '--device', process.env.MOBILE_QA_SIMULATOR_UDID))
  const outputDir = resolve(
    readOption(args, '--dir', process.env.MOBILE_QA_SIMULATOR_SCREENSHOT_DIR ?? defaultOutputDir),
  )
  const outputPath = resolve(readOption(args, '--out', join(outputDir, 'ipad-landscape.png')))
  const waitMs = Number(readOption(args, '--wait', '3000'))
  const url = readOption(args, '--open-url', undefined)
  const landscape = args.includes('--landscape')
  const rawPath = `${outputPath.replace(/\.png$/u, '')}.raw.png`

  await mkdir(dirname(outputPath), { recursive: true })

  if (url) {
    run('xcrun', ['simctl', 'openurl', device, url])
    await new Promise((resolveDelay) => setTimeout(resolveDelay, waitMs))
  }

  run('xcrun', ['simctl', 'io', device, 'screenshot', rawPath])
  await normalizeLandscape(rawPath, outputPath, landscape)
  await unlink(rawPath).catch(() => undefined)

  console.log(`Captured iOS Simulator screenshot: ${outputPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
