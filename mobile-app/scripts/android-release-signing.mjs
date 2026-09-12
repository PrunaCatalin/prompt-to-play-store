#!/usr/bin/env node
/**
 * Wire release signing into the generated Android project.
 *
 * `expo prebuild` regenerates android/ from scratch, so anything we add by hand
 * is lost on every run. This patches the freshly generated build.gradle to read
 * the keystore from environment variables — which is how the CI job passes them
 * in without ever writing a credential to disk beyond the keystore itself.
 *
 * Idempotent: running it twice changes nothing.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const buildGradle = resolve('android/app/build.gradle')

if (!existsSync(buildGradle)) {
  console.error('android/app/build.gradle not found — run `expo prebuild` first.')
  process.exit(1)
}

const required = [
  'ANDROID_KEYSTORE_PATH',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
]

const missing = required.filter((name) => !process.env[name])

if (missing.length > 0) {
  console.error(`Missing environment: ${missing.join(', ')}`)
  process.exit(1)
}

let gradle = readFileSync(buildGradle, 'utf8')

if (gradle.includes('// release-signing: wired')) {
  console.log('Release signing already wired.')
  process.exit(0)
}

const signingConfig = `
    // release-signing: wired
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
`

// Insert the signing config as the first thing inside `android { }`.
gradle = gradle.replace(/android\s*\{/, (match) => `${match}\n${signingConfig}`)

// Point the release build type at it, replacing Expo's debug-key default.
gradle = gradle.replace(
  /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.\w+/,
  '$1signingConfig signingConfigs.release',
)

// Version code and name come from the workflow, so a build is always traceable
// to the run that produced it.
if (process.env.ANDROID_VERSION_CODE) {
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${process.env.ANDROID_VERSION_CODE}`)
}

if (process.env.APP_VERSION) {
  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${process.env.APP_VERSION}"`)
}

writeFileSync(buildGradle, gradle)

console.log('Release signing wired.')
