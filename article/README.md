# The article, as published

`payload.multilang.json` is the body sent to the blog API that publishes the
article describing this repository — English, Romanian, German and French in one
request.

Worth reading if you are building something similar, for two reasons.

**Diagrams travel inline.** The three SVGs from `../docs/diagrams/` are embedded
in the content rather than linked, so there is no asset to host, nothing to break
when a CDN path changes, and they stay sharp at any zoom. They carry their own
light and dark styling.

**Only prose is translated.** Tables, code blocks and diagrams are written once
and injected into every language. The four articles cannot drift apart on the
facts, because the facts exist in exactly one place.

Each translation also carries an AI disclosure block: the English original
declares `usage: draft`, the other three declare `usage: translation`, because
they are not the same claim.
