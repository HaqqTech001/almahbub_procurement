import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FooterSeoJsonLd, GlobalFooter } from "./GlobalFooter.js";

afterEach(() => {
  cleanup();
});

describe("GlobalFooter", () => {
  it("renders contentinfo landmark with all required sections", () => {
    render(<GlobalFooter copyrightYear={2026} />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("hamd-footer");

    const nav = within(footer).getByRole("navigation", { name: "Footer" });
    for (const title of [
      "Company",
      "Products",
      "Industries",
      "Services",
      "Support",
      "Legal",
      "Newsletter",
    ]) {
      expect(
        within(nav).getByRole("heading", { name: title }),
      ).toBeInTheDocument();
    }
    expect(
      within(nav).queryByRole("heading", { name: "Resources" }),
    ).not.toBeInTheDocument();

    expect(within(footer).getByRole("heading", { level: 2, name: "Almahbub International" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "Contact page" })).toBeInTheDocument();
    expect(within(footer).getByText("Powered by HaqqTech")).toBeInTheDocument();
    expect(within(footer).getByText("© 2026 Almahbub International")).toBeInTheDocument();
  });

  it("exposes Request Procurement as a text link, not a filled primary CTA", () => {
    render(<GlobalFooter />);
    const request = screen.getByRole("link", { name: "Request Procurement" });
    expect(request).toHaveAttribute("href", "/contact");
    expect(request).not.toHaveClass("hamd-btn--primary");
  });

  it("keeps social links named for assistive technology", () => {
    render(
      <GlobalFooter
        socialLinks={[
          {
            id: "linkedin",
            label: "Almahbub on LinkedIn",
            href: "https://linkedin.com/company/almahbub",
            icon: "linkedin",
          },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Almahbub on LinkedIn" })).toBeInTheDocument();
  });

  it("omits social block when no verified profiles are provided", () => {
    render(<GlobalFooter socialLinks={[]} />);
    expect(screen.queryByLabelText("Social media")).not.toBeInTheDocument();
  });

  it("validates newsletter email and announces errors", async () => {
    const user = userEvent.setup();
    render(<GlobalFooter onNewsletterSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
    expect(screen.getByLabelText("Email address")).toHaveAttribute("aria-invalid", "true");
  });

  it("submits newsletter via callback and announces success", async () => {
    const user = userEvent.setup();
    const onNewsletterSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GlobalFooter onNewsletterSubmit={onNewsletterSubmit} />);

    await user.type(screen.getByLabelText("Email address"), "ops@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(onNewsletterSubmit).toHaveBeenCalledWith("ops@example.com");
    expect(await screen.findByRole("status")).toHaveTextContent(/Subscribed/i);
  });

  it("keeps footer column links in the DOM for crawlability", () => {
    const { container } = render(<GlobalFooter />);
    const columns = container.querySelectorAll("details.hamd-footer__accordion");
    expect(columns.length).toBe(6);
    expect(screen.getByRole("link", { name: "Request Procurement" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Industries" })).toHaveAttribute(
      "href",
      "/industries",
    );
    expect(screen.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute(
      "href",
      "/cookies",
    );
  });

  it("presents Almahbub Group and distinct businesses without replacing the site brand", () => {
    render(
      <GlobalFooter
        groupName="Almahbub Group"
        groupHref="/group"
        businessLinks={[
          {
            id: "international",
            label: "Almahbub International",
            href: "/businesses/almahbub-international",
            summary: "Procurement · sourcing · supply · logistics",
          },
          {
            id: "integrated-export",
            label: "Almahbub Integrated Export Ltd.",
            href: "/businesses/almahbub-integrated-export",
            summary: "Agro commodities · bulk supply · export",
          },
        ]}
      />,
    );

    const footer = screen.getByRole("contentinfo");
    expect(
      within(footer).getAllByRole("link", { name: "Almahbub Group" })[0],
    ).toHaveAttribute("href", "/group");
    expect(within(footer).getByRole("heading", { level: 2, name: "Almahbub International" })).toBeInTheDocument();
    expect(within(footer).queryByRole("heading", { name: "Businesses" })).not.toBeInTheDocument();
    expect(within(footer).getByText("Procurement · sourcing · supply · logistics")).toBeInTheDocument();
    expect(within(footer).getByText("Agro commodities · bulk supply · export")).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: "Almahbub Integrated Export Ltd." }),
    ).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    expect(within(footer).getByTestId("aie-portal-entry-footer")).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export",
    );
    expect(within(footer).getByText("Powered by HaqqTech")).toBeInTheDocument();
  });

  it("can embed Organization JSON-LD in the footer", () => {
    const { container } = render(<GlobalFooter includeJsonLd />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });
});

describe("FooterSeoJsonLd", () => {
  it("emits Organization JSON-LD", () => {
    const { container } = render(
      <FooterSeoJsonLd
        organizationName="Almahbub International"
        url="https://almahbub.com"
        contactEmail="procurement@almahbub.com"
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.textContent ?? "{}") as {
      "@type": string;
      name: string;
      contactPoint?: { email: string };
    };
    expect(data["@type"]).toBe("Organization");
    expect(data.name).toBe("Almahbub International");
    expect(data.contactPoint?.email).toBe("procurement@almahbub.com");
  });
});
