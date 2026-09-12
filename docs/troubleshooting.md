# Troubleshooting

## Secrets

Four repository secrets, and two repository variables.

| Name | Kind | What it is |
|---|---|---|
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | secret | `base64 -i upload.keystore` of your upload key |
| `ANDROID_KEYSTORE_PASSWORD` | secret | Keystore password |
| `ANDROID_KEY_ALIAS` | secret | Alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | secret | Key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | secret | Service account JSON, release-to-internal only |
| `EXPO_PUBLIC_API_URL` | variable | Public API base for the build |
| `EXPO_PUBLIC_STOREFRONT_HOST` | variable | Public storefront host |

Encode the keystore without newlines:

```bash
base64 -i upload.keystore | tr -d '\n' | pbcopy
```

## Play rejects the version code

`Version code N has already been used.`

`github.run_number` is strictly increasing but starts at 1, and you have almost
certainly uploaded a build by hand while setting the app up. Offset it past
whatever exists:

```yaml
ANDROID_VERSION_CODE: ${{ github.run_number + 100 }}
```

The offset only ever grows. Never lower it.

## The upload fails after a 40-minute build

Usually the missing `whatsnew` directory. The action wants plain text files, one
per locale:

```
.github/whatsnew/whatsnew-en-US
.github/whatsnew/whatsnew-ro-RO
```

Missing locale files fail late, after Gradle has finished, which is the most
expensive moment to discover a typo.

## Crash reports are unreadable

R8 shrank and renamed everything, and the mapping file never reached Play. Keep
`mappingFile` pointed at
`android/app/build/outputs/mapping/release/mapping.txt`. If the path does not
exist, minification is off — check `minifyEnabled` in the release build type.

## `npm ci` fails on peer dependencies

`--legacy-peer-deps` is in the workflow because the React Native ecosystem still
publishes conflicting peer ranges. It is a symptom, not a fix. Try removing it
after a dependency bump; if the install succeeds, leave it out.

## The native build takes forever

Check that the ABI filter landed:

```
reactNativeArchitectures=arm64-v8a,armeabi-v7a
```

`x86` and `x86_64` exist for emulators. Play serves per-ABI, so shipping them to
real devices buys nothing and roughly doubles native compile time.

## The local model is slower than the cloud

It does not fit in memory and is spilling to system RAM. Either drop to a smaller
parameter count or a tighter quantisation. A 14B that fits beats a 27B that does
not, every time.

## The simulator gesture does something unexpected

A gesture starting within 4 points of the screen edge is an iOS **system**
gesture — back, notification shade, app switcher, Control Centre. Start further
in when you mean to drag content near the bezel.

## The agent cannot open the simulator panel

`attach` fails when nothing is booted. Boot a device or run a build first, then
attach. If the error mentions `xcode-select` or a missing platform, that is a
host toolchain problem — the error text names the fix, and most of those need a
password you will have to type yourself.
