# prompt-to-play-store

The working setup behind *[From Prompt to Play Store Without Touching a Phone](#)*:
a local 27B model for volume, a cloud model for judgement, an agent that drives
the iOS Simulator, and a GitHub Actions pipeline that ships a signed Android
bundle to Play internal testing.

Three tiers, one operator, nothing to copy between them by hand.

```
you ──▶ Claude Code ──▶ cloud model     (reasoning, multi-file work)
                   ├──▶ LM Studio       (bulk, private, offline)
                   ├──▶ iOS Simulator   (launch, tap, screenshot, verify)
                   └──▶ git push ──▶ GitHub Actions ──▶ Play internal
```

## Ten-minute start

**1. Local model.** Install [LM Studio](https://lmstudio.ai) (0.4.23 or newer),
download `Qwen3.8 27B` at `Q4_K_M`, load it, start the server.

```bash
lms server start --port 1234
curl http://localhost:1234/v1/models
```

See [`lmstudio/setup.md`](lmstudio/setup.md) for the smaller-hardware options.

**2. Wire it up.**

```bash
cp lmstudio/.env.example .env
```

The key is ignored by the local server; any string works.

**3. The app.**

```bash
cd mobile-app
npm ci --legacy-peer-deps
npx expo prebuild --platform ios --no-install
npx expo run:ios
```

**4. Let the agent drive it.** Open Claude Code in this directory and ask it to
verify a screen. It will attach the simulator panel, launch the build, tap
through, and report back. The flows we run are written down in
[`automation/simulator-flows.md`](automation/simulator-flows.md).

**5. Ship Android.** Set the four secrets listed in
[`docs/troubleshooting.md`](docs/troubleshooting.md#secrets), push to a
`release/**` branch, and the runner builds and uploads.

## What is in here

| Path | Contents |
|---|---|
| [`docs/model-card.md`](docs/model-card.md) | The model used, its specs, and what it is good at |
| [`docs/architecture.md`](docs/architecture.md) | Diagrams, and why the split is where it is |
| [`docs/troubleshooting.md`](docs/troubleshooting.md) | The failures we hit, and the fixes |
| [`lmstudio/`](lmstudio/) | Install, serve, connect |
| [`mobile-app/`](mobile-app/) | Expo app — login, list, detail. Small on purpose |
| [`automation/`](automation/) | The simulator flows worth automating |
| [`.github/workflows/`](.github/workflows/) | Signed AAB → Play internal testing |

## Honest limits

The simulator connector drives **simulators**, not physical devices. There is no
equivalent Android connector — Android automation here is `adb` locally and CI
for anything reproducible.

A local 27B is not a frontier model. It degrades on long context and on chained
tool calls. Use it for volume, not for judgement. `docs/model-card.md` is specific
about where the line falls.

## Licence

MIT.
