# Architecture

## The three tiers

```mermaid
flowchart TB
    Dev(["Developer"])
    subgraph Machine["Your machine"]
        CC["Claude Code · Opus 5"]
        LM["LM Studio · localhost:1234"]
        Model["Qwen3.8 27B · Q4_K_M"]
        Sim["iOS Simulator"]
        Repo[("Repository")]
    end
    subgraph Cloud["Cloud"]
        API["Anthropic API"]
        GH["GitHub Actions"]
        Play["Play · Internal testing"]
    end

    Dev -->|"intent"| CC
    CC <-->|"reasoning"| API
    CC -->|"bulk, private"| LM
    LM --> Model
    CC -->|"edits"| Repo
    CC -->|"attach · launch · tap · screenshot"| Sim
    Repo -->|"push release/**"| GH
    GH -->|"signed AAB"| Play
```

The agent is the only component that touches all the others. That is the whole
point: reading the repo, calling the local model and pressing the screen happen
in one conversation, with no human ferrying results between windows.

## Routing a task

```mermaid
flowchart TD
    T["Task"] --> Q1{"Needs the whole<br/>repo in context?"}
    Q1 -->|yes| Cloud["Cloud model"]
    Q1 -->|no| Q2{"Sensitive data?"}
    Q2 -->|yes| Local["Local 27B"]
    Q2 -->|no| Q3{"High volume,<br/>error tolerant?"}
    Q3 -->|yes| Local
    Q3 -->|no| Cloud
```

Judgement goes to the cloud. Repetition stays home.

| Task | Tier |
|---|---|
| Multi-file refactor, architecture | Cloud |
| Writing tests, guided debugging | Cloud |
| Classifying log lines | Local |
| OCR on screenshots | Local |
| Fixtures and seed data | Local |
| Summarising a long diff | Local |
| Driving the simulator | Connector |

## Two APIs, two callers

```mermaid
flowchart LR
    App["Your application"] -->|"OpenAI SDK · /v1"| LM["LM Studio"]
    Agent["Claude Code"] -->|"Messages API · ANTHROPIC_BASE_URL"| LM
    LM --> M["Loaded model"]
```

LM Studio speaks both. Applications use the OpenAI-compatible endpoint and need
no code changes. A Claude client can be pointed at the Anthropic-compatible one —
useful offline, but not a substitute for a frontier model on the main loop.

## The verification loop

```mermaid
sequenceDiagram
    autonumber
    actor D as Developer
    participant C as Claude Code
    participant B as Build
    participant S as Simulator

    D->>C: "add the password reset screen"
    C->>C: write the code
    C->>S: attach — panel opens
    C->>B: build
    B-->>C: .app
    C->>S: launch
    C->>S: open_url → deep link
    C->>S: screenshot
    C->>C: check layout, contrast, truncation
    C->>S: tap · text · submit
    C->>S: screenshot
    C-->>D: "works, but it clips on iPhone SE"
    C->>C: fix
    C->>S: relaunch · verify
```

Verification lands in the same motion as the change, while the reasoning is still
loaded — not twenty minutes later.

## Shipping Android

```mermaid
flowchart LR
    P["push release/**"] --> G1["checkout · node · java"]
    G1 --> G2["npm ci"]
    G2 --> G3["tsc · eslint"]
    G3 -->|fails| Stop(["stop"])
    G3 --> G4["expo prebuild --clean"]
    G4 --> G5["restore keystore"]
    G5 --> G6["wire signing"]
    G6 --> G7["phone ABIs only"]
    G7 --> G8["bundleRelease"]
    G8 --> G9["upload → Play internal"]
    G9 --> G10["keep AAB 14 days"]
    G10 --> G11["shred keystore · always()"]
```

## Secret lifetime

```mermaid
flowchart LR
    S1["KEYSTORE_BASE64"] --> J
    S2["KEYSTORE_PASSWORD"] --> J
    S3["KEY_ALIAS · KEY_PASSWORD"] --> J
    S4["PLAY_SERVICE_ACCOUNT_JSON"] --> J
    J["Job runtime<br/>ephemeral runner"] --> A["Signed AAB"]
    J -.->|"rm, always()"| X(["shredded"])
```

No third-party build service holds the signing key. The Play service account
should carry exactly one permission — release to internal testing. If it leaks,
the blast radius is a bad build on a track testers can roll back.
