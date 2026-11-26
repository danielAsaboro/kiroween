# app-one — Geopolitics: US strikes Iran

The Geopolitics board for Omens. It tracks the Polymarket question **"US strikes Iran by February 28, 2026?"**

## Tells

| Tell               | Status     | Notes                                                                                                   |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| Fresh-wallet money | **killed** | Adds no skill over the market at a week horizon; delta Brier −0.007 (gap tell, preregistered kill rule) |
| Tankers            | pending    | KC-135/KC-46 counts in a Europe + Middle East box vs 8-week median                                      |
| Pizza              | collecting | No point-in-time history yet                                                                            |

## Notes

The board reads `fixtures/omens/board-data.json` for every fused reading, market price, gap and score card it shows. It is a static page: no server, no accounts, no trading advice.

Built with the shared UI kit from `skeleton/src/ui/` and the tell adapters from `skeleton/src/tells/`.
