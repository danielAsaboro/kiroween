---
inclusion: always
---

# Tell Contract

## Structure

Every tell is two things:

1. A Kiro spec at `.kiro/specs/tell-<name>/` describing intent, inputs, outputs and acceptance criteria.
2. A node adapter at `skeleton/src/tells/<name>.ts` that is the sole source of readings for that tell.

## Reading shape

Every adapter exports readings that conform to:

```typescript
interface Reading {
  tell: string;        // tell identifier, e.g. "fresh-wallet"
  market: string;      // Polymarket market slug
  createdAt: string;   // ISO-8601 UTC
  value: number;       // normalised 0–1
  line: number;        // fire line threshold (0–1)
  fired: boolean;      // value >= line
  method: string;      // short description of the measurement method
  src: string;         // URL or identifier of raw data source
}
```

A reading also carries:

- **baseline** — the value at registration, used by the grader as the pre-signal reference.
- **fire line** — the threshold the value must cross to count as a signal.

## Privacy rule

Adapters carry **no personal data**. For wallet-based tells, include only:

- wallet age (days since first transaction)
- wallet size (USD at time of observation)
- transaction timing (minutes since last activity)

Never include a wallet address, ENS name, or any identifier that could be linked back to an individual.

## Weight bootstrap

A new tell starts at **weight 0**. The grader assigns weight only after scoring it against settled markets. Until then the tell is visible on the board but labelled "ungraded".
