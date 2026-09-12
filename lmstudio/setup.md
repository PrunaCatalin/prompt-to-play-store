# LM Studio — install, serve, connect

## Install

[lmstudio.ai](https://lmstudio.ai) — macOS 14+ on Apple Silicon, Windows, Linux.
0.4.23 or newer. No Docker, no Python environment, nothing to compile.

## Download a model

In the app, search `Qwen3.8 27B` and take the `Q4_K_M` GGUF. If your machine is
smaller, pick from the table in [`../docs/model-card.md`](../docs/model-card.md)
rather than forcing the 27B.

## Serve it

Either flip *Status* to **Running** in the Developer tab, or:

```bash
lms server start --port 1234
```

Check:

```bash
curl http://localhost:1234/v1/models
```

Two APIs are exposed on that port:

| Endpoint | Shape | Who calls it |
|---|---|---|
| `http://localhost:1234/v1` | OpenAI-compatible | Applications, SDKs, scripts |
| `http://localhost:1234` | Anthropic Messages API | Claude clients |

## Call it from an application

Any OpenAI SDK works unchanged:

```js
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: 'http://localhost:1234/v1',
  apiKey: 'lm-studio',
})

const res = await client.chat.completions.create({
  model: 'qwen3.8-27b',
  messages: [{ role: 'user', content: 'Classify this log line: ...' }],
})
```

From PHP, with `laravel/ai`, it is an environment change and nothing else — see
[`.env.example`](.env.example).

The API key is ignored by the local server. Any string works.

## Point a Claude client at it

```bash
export ANTHROPIC_BASE_URL=http://localhost:1234
claude
```

Useful offline and for short, local questions. Not a substitute for a frontier
model on multi-file work — see the limits section of the model card.

## Keep it running

`lms server start` survives terminal exit. To run it on boot, wrap it in a
launchd plist on macOS or a systemd unit on Linux. The server is stateless; the
loaded model is the only thing that takes time to come back.
