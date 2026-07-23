# Translation files

## Status

| Locale | File | Status |
|---|---|---|
| English | `en.json` | ✅ Source of truth, full coverage |
| French | `fr.json` | ✅ Full coverage, high-confidence translation |
| Wolof | `wo.json` | ⛔ Empty — **do not populate without native-speaker/professional review** |
| Mandinka | `mnk.json` | ⛔ Empty — **do not populate without native-speaker/professional review** |
| Fula (Fulfulde) | `ff.json` | ⛔ Empty — **do not populate without native-speaker/professional review** |
| Jola | `dyo.json` | ⛔ Empty — **do not populate without native-speaker/professional review** |
| Serer (Seereer) | `srr.json` | ⛔ Empty — **do not populate without native-speaker/professional review** |

## Why the five regional files are empty

Royal Chain Wallet is a financial product. A wrong or ambiguous translation
of "Confirm", "Send", "Recovery Phrase", or similar wallet-critical terms
is a real-money risk, not a cosmetic bug. These five languages were
intentionally left as empty JSON objects (`{}`) rather than filled with
AI-generated guesses, so every key safely falls back to the reviewed
English source (`en.json`) instead of showing unverified text.

`src/lib/i18n/config.ts` marks each of these locales `releaseReady: false`,
which keeps them out of the active language selector (shown as
"Coming Soon" instead) until this is resolved — see that file for the
enforcement, and `src/routes/app.settings.tsx` for where it's surfaced in
the UI.

## How to add a real translation

1. Have a native speaker or professional translator translate every key
   in `en.json` into the target language, preserving the `{{param}}`
   interpolation placeholders and the `_one`/`_other` pluralization key
   suffixes exactly.
2. Fill in the corresponding locale file (e.g. `wo.json`) with the
   reviewed translations — partial coverage is fine, since missing keys
   automatically fall back to English.
3. Have a second native speaker review the wallet UI end-to-end in that
   language, specifically the Send, Receive, Swap, Stake, and Security
   Center flows (highest financial-risk surfaces).
4. Flip `releaseReady: true` for that locale in `src/lib/i18n/config.ts`.

Do not skip step 3. A technically-correct word-for-word translation can
still be ambiguous or misleading in a financial-confirmation context.
