import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  component: Privacy,
  head: () => ({ meta: [{ title: "Privacy Policy — Royal Chain Wallet" }] }),
});

function Privacy() {
  return (
    <article className="prose prose-sm max-w-none text-foreground">
      <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString()}
      </p>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Royal Chain Wallet is committed to safeguarding your personal and financial data. We collect
        only the information necessary to provide secure wallet services, prevent fraud, and comply
        with financial regulations.
      </p>
      {["Data we collect", "How we use your data", "Data security", "Your rights", "Contact"].map(
        (h) => (
          <section key={h} className="mt-6">
            <h2 className="font-display text-lg font-bold">{h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Detailed information about {h.toLowerCase()} is available on request. We use
              industry-standard encryption (AES-256) and never share your data with third parties
              without consent.
            </p>
          </section>
        ),
      )}
    </article>
  );
}
