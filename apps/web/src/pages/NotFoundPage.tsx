import { ErrorState } from "@hamd/ui/primitives";
import { useEffect } from "react";
import { applyPageSeo } from "../lib/seo.js";

export function NotFoundPage() {
  useEffect(() => {
    applyPageSeo({
      title: "Page not found",
      description: "This address is incorrect or the page is not available.",
      path: "/404",
      noIndex: true,
    });
  }, []);

  return (
    <ErrorState
      title="Page not found"
      description="This address is incorrect, or the page is not part of the Version 2 public site."
      actionHref="/"
      actionLabel="Return to homepage"
    >
      <p>
        <a href="/contact">Contact specialist</a>
        {" · "}
        <a href="/products">Browse products</a>
      </p>
    </ErrorState>
  );
}
