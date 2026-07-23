import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  component: Terms,
  head: () => ({ meta: [{ title: "Terms of Service — Royal Chain Wallet" }] }),
});

function Terms() {
  return (
    <article className="prose prose-sm max-w-none text-foreground">
      <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective: {new Date().toLocaleDateString()}
      </p>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        By using Royal Chain Wallet you agree to these terms. Our platform is provided by Royal
        FinTech Company and licensed to operate digital wallet services.
      </p>
      {[
        "Eligibility",
        "Account & security",
        "Fees",
        "Prohibited activity",
        "Limitation of liability",
        "Governing law",
      ].map((h) => (
        <section key={h} className="mt-6">
          <h2 className="font-display text-lg font-bold">{h}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {h} clauses apply to all users of the service. Continued use of the platform constitutes
            acceptance of any updated terms.
          </p>
        </section>
      ))}
    </article>
  );
}
