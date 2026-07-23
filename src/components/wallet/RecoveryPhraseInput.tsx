import { useMemo } from "react";
import { X } from "lucide-react";

// Minimal BIP39-inspired suggestion dictionary (mock — a real integration
// would ship the full BIP39 wordlist and validate against it).
const SUGGESTION_WORDS = [
  "royal",
  "chain",
  "wallet",
  "secure",
  "vault",
  "harbor",
  "signal",
  "orbit",
  "cipher",
  "lantern",
  "compass",
  "ember",
  "meadow",
  "silver",
  "granite",
  "aurora",
  "falcon",
  "delta",
  "echo",
  "juniper",
  "kestrel",
  "onyx",
  "quartz",
  "sable",
  "titan",
  "verse",
  "willow",
  "zenith",
  "nomad",
  "cobalt",
  "ivory",
  "prism",
  "harvest",
  "canyon",
  "phoenix",
  "atlas",
  "beacon",
  "quantum",
  "nova",
  "solstice",
  "helix",
  "borealis",
  "monarch",
  "regal",
  "sterling",
  "ledger",
  "keystone",
  "obelisk",
  "abandon",
  "ability",
  "able",
  "about",
  "above",
  "absent",
  "absorb",
  "abstract",
  "action",
  "actor",
  "adapt",
  "admit",
  "adult",
  "advance",
  "advice",
  "aerobic",
];

export function isKnownWord(w: string) {
  return SUGGESTION_WORDS.includes(w.trim().toLowerCase());
}

interface Props {
  words: string[];
  onChange: (words: string[]) => void;
  length: 12 | 24;
}

export function RecoveryPhraseInput({ words, onChange, length }: Props) {
  const invalidIndexes = useMemo(
    () => words.map((w, i) => (w && !isKnownWord(w) ? i : -1)).filter((i) => i >= 0),
    [words],
  );
  const missing = words.slice(0, length).filter((w) => !w.trim()).length;

  const setWord = (i: number, v: string) => {
    const next = [...words];
    next[i] = v.replace(/\s+/g, "").toLowerCase();
    onChange(next);
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return;
    e.preventDefault();
    const next = [...words];
    for (let j = 0; j < parts.length && i + j < length; j++) {
      next[i + j] = parts[j].toLowerCase();
    }
    onChange(next);
    // Best-effort: clear clipboard shortly after paste for safety.
    setTimeout(() => navigator.clipboard?.writeText("").catch(() => {}), 800);
  };

  const clearAll = () => onChange(Array(length).fill(""));

  return (
    <div>
      <div className="rounded-2xl border border-border bg-muted/40 p-3">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length }).map((_, i) => {
            const w = words[i] ?? "";
            const invalid = w && !isKnownWord(w);
            return (
              <div
                key={i}
                className={`flex items-center gap-1 rounded-xl bg-card px-2 py-1.5 text-xs ring-1 transition ${
                  invalid ? "ring-destructive/60" : "ring-transparent focus-within:ring-gold/60"
                }`}
              >
                <span className="text-muted-foreground">{i + 1}.</span>
                <input
                  value={w}
                  onChange={(e) => setWord(i, e.target.value)}
                  onPaste={(e) => handlePaste(i, e)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent font-medium outline-none"
                  placeholder="word"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div className="text-muted-foreground">
          {missing === 0 ? (
            invalidIndexes.length > 0 ? (
              <span className="text-destructive">
                Check word{invalidIndexes.length > 1 ? "s" : ""}:{" "}
                {invalidIndexes.map((i) => i + 1).join(", ")}
              </span>
            ) : (
              <span className="text-success">All {length} words entered</span>
            )
          ) : (
            <span>
              {missing} word{missing > 1 ? "s" : ""} missing
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear all
        </button>
      </div>
    </div>
  );
}
