# Simulator flows worth automating

The connector drives the iOS Simulator directly: it opens a live panel, installs
the build, taps, types, swipes, presses hardware buttons, opens deep links and
reads the screen back.

| Action | What it does |
|---|---|
| `attach` | Opens the live panel so you can watch |
| `launch` | Installs the `.app` and starts it |
| `screenshot` | Captures the screen |
| `tap` | Taps at a point; over 0.5s becomes a long press |
| `swipe` | Gesture between two points |
| `touch_path` | Arbitrary path with easing |
| `touch2_path` | Two fingers — pinch, rotate |
| `text` | Types into the focused field |
| `button` | HOME, LOCK, SIRI, Apple Pay |
| `open_url` | Deep link straight into a screen |

Coordinates are device points, origin top-left.

---

## Flow 1 — Sign in, happy path

Deep link past the screens you are not testing. Tapping forward from the home
screen every run is wasted time and a source of flaky failures.

```
open_url  demo://login
screenshot                      → empty state, both fields visible
tap       email field
text      "reader@example.com"
tap       password field
text      "correct-horse"
tap       Sign in
screenshot                      → list screen, no spinner left behind
```

**Assert:** the list renders, the spinner is gone, no error banner.

## Flow 2 — Sign in, wrong password

The screen nobody checks by hand because it needs a deliberate mistake.

```
open_url  demo://login
tap       email field
text      "reader@example.com"
tap       password field
text      "wrong"
tap       Sign in
screenshot                      → error message, fields still filled
```

**Assert:** the message is readable, the email survives the failure, the password
field is cleared.

## Flow 3 — Small device truncation

Run flows 1 and 2 on iPhone SE. This is where padding assumptions die.

**Assert:** no clipped buttons, no truncated labels, the submit button is above
the keyboard.

## Flow 4 — Long strings

Switch the app language to the longest supported locale and repeat flow 1.
German and Romanian break layouts that English never does.

**Assert:** labels wrap rather than truncate; buttons grow rather than clip.

## Flow 5 — Empty and error states

```
open_url  demo://list?state=empty
screenshot
open_url  demo://list?state=error
screenshot
```

**Assert:** both states have a title, an explanation and a way out. An empty
screen with no call to action is a bug, not a state.

## Flow 6 — Dark mode

Every screen above, once more, in dark mode. One line to check, one support
ticket to miss.

---

## Notes from running these

A gesture starting within 4 points of the edge is an iOS **system** gesture —
back, notification shade, app switcher, Control Centre. Start further in when
dragging content near the bezel.

Screenshots alone are weak evidence. What makes this useful is asserting
something specific about each one: a string present, a button reachable, a
spinner gone. "Looks fine" is not an assertion.

The panel is for you, not for the agent. Screenshot and input work whether or not
it is open — but watching the first few runs is how you learn which flows are
worth keeping.
