# Setting up Google Play for automated releases

How to go from nothing to *a push on `release/**` ships a build to testers*, on a
fresh Play account.

Follow it top to bottom, once per app. **Order matters**: Google refuses API
uploads until the app exists in the console, a first bundle has been uploaded by
hand, a service account has been invited **and** the API has been enabled.
Skipping a step produces errors that do not say which step you skipped.

Placeholders used throughout: `<package-name>`, `<client>`, `<project-id>`,
`<store-domain>`. Substitute your own.

---

## 0. Decide what "new account" means

| Situation | Package name | Keystore | Repository |
|---|---|---|---|
| New Play account, same app (migration) | **must change** — a package name cannot exist in two accounts | new, or moved if you hold the key | may stay |
| New Play account, new app | new | new | preferably new |
| Same account, new app | new | reusable | your choice |

**The package name is permanent.** It cannot be changed after the first upload
and cannot be reused, even after deleting the app. Lowercase, reverse-domain,
no hyphens.

**The signing key is more permanent still.** A lost *upload* key can be reset
through Google support. A lost *app signing* key, without Play App Signing, ends
the app. Which is why the recipe below uses Play App Signing — Google holds the
real key, you hold only the upload key.

---

## 1. Prerequisites

- A Google account for the new developer — an organisation account if you have
  a company, for reasons in §2.1.
- **25 USD**, one-off, at developer account creation.
- A machine with Node 22+, Java 17, the Android SDK, and the `gh` CLI
  authenticated.
- Admin access on the GitHub repository.

---

## 2. Play Console — account and app

### 2.1 Create the developer account

1. Sign up at the Play Console with the new owner's Google account.
2. Choose the type: **Organization** if you have a registered company — it
   requires documents and takes days to verify — or **Personal**.
3. Pay the 25 USD fee.
4. **Identity verification is mandatory** and can take several days. Until it
   clears you can create the app and push builds to test tracks, but not
   publish to production.

> **New personal accounts have an extra hurdle.** Google requires recently
> registered individual developers to run a **closed test with a minimum number
> of testers over 14 consecutive days** before they can request production
> access. Organisation accounts are exempt. The exact numbers change — check
> *Test and release → Publishing overview* in the console. If it applies to you,
> recruit testers on day one, not at the end.

### 2.2 Create the app

*All apps → Create app*: name, default language, app or game, free or paid.

**Free cannot become paid later.** Choose deliberately.

### 2.3 Note the two identifiers

The console URL contains a developer id and an app id. You will need both later.
Keep them with the project notes — they are not secrets, but they are tedious to
find again.

---

## 3. The upload keystore

Generated **once** per app, and guarded accordingly.

```bash
keytool -genkeypair -v \
  -keystore ~/keys/upload-<client>.keystore \
  -alias <client>-upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype PKCS12
```

`keytool` asks for a password — minimum six characters — and identity fields that
end up in the certificate. With PKCS12, **the key password equals the keystore
password**.

Store the password in your OS keychain so scripts never prompt:

```bash
security add-generic-password -s <client>-upload-keystore -a <client> -w
```

**Back both up**: the `.keystore` file and the password, in a password manager.
Without them you cannot ship updates.

Its fingerprint, for later comparison:

```bash
keytool -list -v -keystore ~/keys/upload-<client>.keystore -alias <client>-upload | grep SHA256
```

---

## 4. Google Cloud — the service account

The robot that uploads from CI.

### 4.1 Project and account

1. Create a Google Cloud project. Note the **Project ID**.
2. *IAM & Admin → Service Accounts → Create service account*. Name it
   `play-publisher`. **Grant no roles** — permissions come from the Play
   Console, not from GCP.
3. Open it → *Keys → Add key → Create new key → JSON*. The file downloads once.
   **This is a secret.** It never reaches git.

### 4.2 Enable the API — the step everyone forgets

*APIs & Services → Library* → **Google Play Android Developer API** → **Enable**,
on the same project.

> Without it, CI fails at upload with *"Google Play Android Developer API has not
> been used in project … before or it is disabled"*. Enabling it takes a minute;
> finding out why the build failed takes an afternoon.

### 4.3 Invite the service account into Play

Play Console → *Users and permissions → Invite new user*:

- Email: `play-publisher@<project-id>.iam.gserviceaccount.com`
- App permissions → your app → tick **Release apps to testing tracks** and
  **Manage testing track** (needed for release notes).
- Add *Release to production* only when you actually want automated production
  releases.

The account shows as active immediately. There is no invitation email to accept.

---

## 5. Repository secrets

Encode the keystore:

```bash
base64 -i ~/keys/upload-<client>.keystore | pbcopy
```

Set them interactively, so nothing lands in shell history:

```bash
gh secret set ANDROID_UPLOAD_KEYSTORE_BASE64
gh secret set ANDROID_KEY_ALIAS
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_PASSWORD
gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON < ~/Downloads/<file>.json
gh secret list
```

Public build-time values go in variables, not secrets — they end up in the
bundle either way:

```bash
gh variable set EXPO_PUBLIC_API_URL --body "https://<store-domain>/api/mobile/v1"
gh variable set EXPO_PUBLIC_STOREFRONT_HOST --body "<store-domain>"
```

Then **delete the downloaded JSON** from your machine.

---

## 6. What changes in the code

| File | Change |
|---|---|
| `app.json` → `expo.android.package`, `expo.ios.bundleIdentifier` | the new package name, **identical on both** |
| `app.json` → `expo.name`, `expo.slug` | the app name |
| `app.json` → deep link hosts and associated domains | the store domain |
| `.github/workflows/android-internal.yml` → `packageName:` | the new package name |
| `.github/whatsnew/whatsnew-*` | notes for testers |

The rest of the pipeline — signing, version codes, ABI filtering, upload — is
generic and does not need touching.

`versionCode` comes from `github.run_number`, so it increases on its own and
never repeats **within one repository**. Move to a new repo and the count starts
at 1 again; see troubleshooting.

---

## 7. The first bundle, by hand

Google **refuses** API uploads into an app that has never received a build
through the console. This step is unavoidable exactly once.

Build locally, then: *Test and release → Testing → Internal testing → Create new
release*.

1. When asked about **Play App Signing**, accept — use the Google-generated key.
2. Upload the `.aab`.
3. Any release name and notes will do.
4. *Next → Save → Review release → Start rollout to Internal testing*.

The console will also demand the **App content** forms the first time: privacy
policy, ads declaration, content rating, target age, data safety. Fill them once;
until then the release stays blocked with explicit errors.

---

## 8. The signing fingerprint, for deep links

After the first upload, Google's real signing key exists.

*Test and release → Setup → App integrity → App signing* shows **two**
fingerprints:

- **App signing key certificate** → SHA-256 → **this is the one** that goes into
  `assetlinks.json` on your domain.
- *Upload key certificate* → your local key. **Not** for deep links.

Confusing the two is the classic failure: everything looks correct, and links
open in Chrome instead of the app, with no error anywhere.

Verify after deploying the file:

```bash
curl -s https://<store-domain>/.well-known/assetlinks.json
```

On a device, with the app installed **from Play** — not a local build:

```bash
adb shell pm get-app-links <package-name>   # must say "verified"
```

---

## 9. The first automated upload

```bash
git checkout -b release/$(date +%F)
git push -u origin release/$(date +%F)
gh run watch
```

Expect 25–35 minutes: Gradle plus native compilation for `arm64-v8a` and
`armeabi-v7a`. The x86 ABIs are disabled on purpose — they exist for emulators
and roughly double the time.

Success shows in the console as **Available to internal testers** a few minutes
after the job goes green.

---

## 10. Testers

*Internal testing → Testers*:

1. **Create email list** → add the testers' Google addresses — the account they
   use in the Play app on their phone, not another address.
2. Tick the list, save.
3. **Copy link** and send it.

Each tester opens the link, accepts the invitation, then installs from Play.
Without accepting, the app simply does not exist for them, however hard they
search.

Later updates arrive automatically, minutes after each CI run.

---

## 11. Checklist

- [ ] Play account created, fee paid, identity verified
- [ ] App created, package name final
- [ ] Keystore generated, password in the keychain, **backed up**
- [ ] GCP project, service account, JSON key
- [ ] **Play Android Developer API enabled**
- [ ] Service account invited with testing-track permissions
- [ ] Five secrets and two variables set on the repository
- [ ] Package name updated in `app.json` and the workflow
- [ ] First bundle uploaded by hand, App content forms completed
- [ ] **App signing** fingerprint sent to whoever owns the domain
- [ ] Push to `release/**` → green build → visible to testers
- [ ] Tester list created and the invitation link sent
- [ ] Downloaded service account JSON deleted

---

## 12. Troubleshooting

| Symptom | Actual cause |
|---|---|
| `API has not been used in project … or it is disabled` | §4.2 — the API is not enabled on that GCP project |
| `403` / not authorised on upload | Service account not invited, or missing *Release apps to testing tracks* |
| `Package not found` / `has not been uploaded before` | The manual first upload (§7) is missing |
| `Version code N has already been used` | New repository, so `run_number` restarted at 1. Add an offset: `ANDROID_VERSION_CODE: ${{ github.run_number + 100 }}` |
| Keystore error during the bundle step | Wrong password in a secret. With PKCS12 both passwords are the same |
| Failure at typecheck or lint | The code does not compile. Run `npx tsc --noEmit && npx eslint .` locally |
| Job exceeds the timeout | Check that the x86 ABIs have not crept back in |
| App invisible to a tester | Invitation not accepted, or they are signed into Play with a different Google account |
| Deep links open the browser | Wrong fingerprint in `assetlinks.json` — upload key instead of app signing key — or the build was installed locally rather than from Play |

Full logs: GitHub → *Actions* → the run → the red step.

---

## 13. iOS, briefly

The App Store equivalent needs an active Apple Developer Program membership
(99 USD/year), a distribution certificate, a provisioning profile, and an App
Store Connect API key — seven secrets rather than five. The bundle identifier
must match the Android package name. The shape of the workflow is the same:
build on the runner, sign inside the job, upload to TestFlight, shred the
credentials at the end.
