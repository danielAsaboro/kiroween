# app-two — Layoffs: Microsoft, Meta

The Layoffs board for Omens. It tracks **Kalshi company-layoff markets** (KXCOMPANYLAYOFF) for Microsoft and Meta.

## Tells

| Tell                                          | Status     |
| --------------------------------------------- | ---------- |
| CA/WA WARN filings                            | collecting |
| SEC EDGAR 8-K Item 2.05 filings               | collecting |
| Job-board openings (Greenhouse, Lever, Ashby) | collecting |

## Grading status

The layoff tell family is **ungraded**. About 12 layoff markets have settled — well under the preregistered floor of 30 needed for a reliable score. Every score card will carry a low-n warning until that floor is reached.

## Notes

The board reads `fixtures/omens/board-data.json` for every fused reading, market price, gap and score card it shows. It is a static page: no server, no accounts, no trading advice.

Built with the shared UI kit from `skeleton/src/ui/` and the tell adapters from `skeleton/src/tells/`.
