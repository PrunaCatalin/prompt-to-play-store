# Model card — the local tier

## What we run

| Spec | Value |
|---|---|
| Model | Qwen3.8 27B |
| Quantisation | Q4_K_M (GGUF) |
| File size | ~16.8 GB |
| Recommended memory | 24 GB VRAM, or 32 GB unified |
| Context | 128k tokens |
| Engine | llama.cpp (CUDA / Metal) or MLX on Apple Silicon |
| Served by | LM Studio 0.4.23 |
| Source | https://huggingface.co/lmstudio-community/Qwen3.8-27B-GGUF |

Mirrors, if the primary is slow: [bartowski](https://huggingface.co/bartowski/Qwen3.8-27B-GGUF),
[unsloth](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF),
[ggml-org](https://huggingface.co/ggml-org/Qwen3.8-27B-GGUF). The same
quantisation ships at 16.8–19 GB depending on how the repo treats embedding
layers. All of them load in LM Studio.

## Sizing for what you actually have

Rule of thumb for weights alone: **parameters in billions × 0.6** for Q4, in GB.
Context is on top of that.

| Memory | Model class | Notes |
|---|---|---|
| 4–6 GB | 3–4B Q4 | Classification and extraction only |
| 8–12 GB | 7–14B Q4/Q5 | Usable for summaries and simple code |
| 16–24 GB | 13–30B Q4_K_M | The sweet spot; this is our tier |
| 32 GB+ | 30B+ with long context | Diminishing returns for this workload |

**Do not force a model that does not fit.** Spilling into system RAM is slower
than the cloud round trip you were avoiding. With 12 GB, take a 14B and keep it
resident.

## What this tier is good at

- Classifying and clustering log lines
- Summarising diffs and commit ranges
- OCR and text extraction from screenshots
- Generating fixtures, seed data, test inputs
- Short, local code questions — one function, one regex, one rename

## Where it stops

- **Long context.** Quality falls off well before the advertised window.
- **Chained tool calls.** It loses the thread after a few hops.
- **Multi-file reasoning.** Holding six files in mind at once is not its job.

The split is not a cost optimisation. It is a capability match: the local tier
makes it reasonable to run things you would otherwise skip because they were not
worth a frontier call.

## Reproducing our numbers

Benchmarks are hardware-specific and ours are not yours. Measure on your own box:

```bash
# tokens/second, first-token latency, with the model loaded
lms log stream
```

Record the machine, the engine (llama.cpp vs MLX), the quantisation and the
context length alongside any number you publish. Without those four, a
tokens/second figure means nothing.
