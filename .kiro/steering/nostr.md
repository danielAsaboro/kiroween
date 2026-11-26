---
inclusion: fileMatch
fileMatchPattern: skeleton/src/nostr/**
---

# Nostr Publishing

## What gets published

Every reading is published as a **Nostr kind-1 note**. The note content carries:

- The reading payload (JSON, minified).
- The **hash-chain head**: the SHA-256 of the previous note's event ID concatenated with the current reading's JSON. This creates a tamper-evident chain per tell.

## Relays

Publish to all three relays on every cycle:

| Relay   | WebSocket URL               |
|---------|-----------------------------|
| Damus   | `wss://relay.damus.io`      |
| nos.lol | `wss://nos.lol`             |
| Primal  | `wss://relay.primal.net`    |

## Retry policy

- Relays may refuse a note (AUTH required, rate limit, etc.).
- On refusal or timeout, retry the note at the start of the **next cycle**.
- Do not block the current cycle waiting for a relay; publish fire-and-retry.
- Log each refusal with relay URL, error code and timestamp.

## Code location

All relay logic lives under `skeleton/src/nostr/`. Nothing outside that directory should open a WebSocket to a Nostr relay.
