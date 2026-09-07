import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  CompanyOverviewSection,
  CtaSection,
  FaqSection,
  FeaturedProductsSection,
  GroupSection,
  IndustriesSection,
  NewsletterSection,
  PlatformStatisticsSection,
  ProcurementWorkflowSection,
  ServicesSection,
  SisterBusinessDiscoverySection,
  SupplierNetworkSection,
  TestimonialsSection,
  TrustSection,
  WhyChooseUsSection,
} from "./index.js";
import { homepageFixtures } from "./fixtures.js";

describe("Homepage sections", () => {
  it("renders trust indicators", () => {
    const { trust } = homepageFixtures;
    render(
      <TrustSection
        title={trust.title}
        description={trust.description}
        indicators={trust.indicators}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: trust.title })).toBeInTheDocument();
    expect(screen.getByText("Managed end-to-end process")).toBeInTheDocument();
  });

  it("renders company overview, supplier network, platform statistics, and newsletter", () => {
    const { companyOverview, supplierNetwork, platformStatistics, newsletter } = homepageFixtures;

    const { rerender } = render(
      <CompanyOverviewSection
        title={companyOverview.title}
        description={companyOverview.description}
        body={[...companyOverview.body]}
        primaryCta={companyOverview.primaryCta}
        secondaryCta={companyOverview.secondaryCta}
      />,
    );
    expect(screen.getByRole("heading", { name: companyOverview.title })).toBeInTheDocument();
    expect(screen.getByText(companyOverview.body[0]!)).toBeInTheDocument();
    expect(screen.queryByText(/powered by haqq tech/i)).not.toBeInTheDocument();

    rerender(
      <SupplierNetworkSection
        title={supplierNetwork.title}
        description={supplierNetwork.description}
        partners={[...supplierNetwork.partners]}
        viewAllHref={supplierNetwork.viewAllHref}
      />,
    );
    expect(screen.getByRole("link", { name: /Corridor Logistics Partner/i })).toBeInTheDocument();

    rerender(
      <PlatformStatisticsSection
        title={platformStatistics.title}
        description={platformStatistics.description}
        stats={[...platformStatistics.stats]}
        methodologyHref={platformStatistics.methodologyHref}
      />,
    );
    expect(screen.getByText("12+")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /How we measure/i })).toBeInTheDocument();

    rerender(
      <NewsletterSection
        title={newsletter.title}
        description={newsletter.description}
        helpText={newsletter.helpText}
        privacyHref={newsletter.privacyHref}
      />,
    );
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("renders group businesses as separate companies", () => {
    const { group } = homepageFixtures;
    render(
      <GroupSection
        title={group.title}
        description={group.description}
        body={group.body}
        businesses={group.businesses}
        overviewCta={group.overviewCta}
      />,
    );

    expect(screen.getByText("Part of Almahbub Group")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Almahbub Group" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Almahbub International" }).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { name: "Almahbub Integrated Export Ltd." }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/not a department of Almahbub International/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View profile" }).length).toBe(2);
    expect(screen.getByRole("link", { name: /explore almahbub group/i })).toBeInTheDocument();
    expect(document.querySelector(".hamd-group-structure")).toBeTruthy();
  });

  it("renders intentional Integrated Export discovery entry", () => {
    render(
      <SisterBusinessDiscoverySection
        groupEyebrow="Part of Almahbub Group"
        groupTagline="Two businesses. One broader supply and trade ecosystem."
        currentLabel="Current website"
        currentName="Almahbub International"
        currentFocus="Procurement, importation, sourcing, supply, logistics"
        currentSummary="The operating company behind this platform."
        currentDescription="Almahbub International is a Nigerian partner for cross-border buying."
        currentCapabilities={["Procurement", "Importation", "Sourcing", "Supply", "Logistics"]}
        currentLogoSrc="/almahbub.svg"
        currentCta={{ href: "/contact", label: "Request Procurement" }}
        exploreLabel="Explore our other business"
        eyebrow="Interested in agro and export?"
        title="Explore Almahbub Integrated Export Ltd."
        description="A separately registered Almahbub Group business."
        focus="Agro commodities, bulk supply, export"
        href="/businesses/almahbub-integrated-export"
        ctaLabel="Explore Integrated Export"
        capabilities={["Agro commodities", "Bulk supply", "Export"]}
        mark="IE"
        tone="export"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /two businesses\. one broader supply/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/current website/i)).toBeInTheDocument();
    expect(screen.getByText(/explore our other business/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Almahbub International" })).toBeInTheDocument();
    expect(screen.getByText(/operating company behind this platform/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request Procurement" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("heading", { name: "Almahbub Integrated Export Ltd." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore integrated export/i })).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export",
    );
    expect(screen.getByTestId("aie-portal-entry-cta")).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export",
    );
    expect(screen.getByTestId("aie-portal-entry")).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export",
    );
    expect(screen.getByText(/agro commodities, bulk supply, export/i)).toBeInTheDocument();
    expect(document.querySelector(".hamd-business-relation")).toBeTruthy();
    expect(document.querySelector(".hamd-business-relation__panel--export")).toBeTruthy();
  });

  it("renders services as keyboard-operable links with services CTA", () => {
    const { services } = homepageFixtures;
    render(
      <ServicesSection
        title={services.title}
        description={services.description}
        services={services.services}
        primaryCta={services.primaryCta}
      />,
    );

    expect(screen.getByRole("link", { name: /Global Procurement/i })).toHaveAttribute(
      "href",
      "/services",
    );
    expect(screen.getByRole("link", { name: /View all services/i })).toBeInTheDocument();
    const list = document.querySelector(".hamd-services__grid");
    expect(list?.tagName).toBe("UL");
    expect(list).toHaveClass("hamd-services__grid");
    expect(list?.querySelectorAll(".hamd-services__item")).toHaveLength(4);
    expect(list?.querySelectorAll(".hamd-services__icon")).toHaveLength(4);
    expect(list?.querySelectorAll(".hamd-services__chevron")).toHaveLength(4);
    expect(screen.queryByText(/Explore service/i)).toBeNull();
  });

  it("renders featured products with catalog cards and quick quote", () => {
    const { products } = homepageFixtures;
    render(
      <FeaturedProductsSection
        title={products.title}
        description={products.description}
        products={products.products}
        catalogHref={products.catalogHref}
        categories={products.categories}
      />,
    );
    expect(screen.getByRole("heading", { name: "Industrial components" })).toBeInTheDocument();
    expect(screen.getByText(/available to source/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Request Procurement/i })).toHaveAttribute(
      "href",
      "/contact?product=industrial-components",
    );
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("renders interactive procurement timeline with where / next / duration", async () => {
    const user = userEvent.setup();
    const { workflow } = homepageFixtures;
    render(
      <ProcurementWorkflowSection
        title={workflow.title}
        description={workflow.description}
        primaryCta={workflow.primaryCta}
        defaultStepId={workflow.defaultStepId}
      />,
    );

    const timeline = screen.getByTestId("interactive-procurement-timeline");
    expect(timeline).toBeInTheDocument();
    expect(within(timeline).getByRole("button", { name: /^Request/i })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(timeline).getByText("Where you are")).toBeInTheDocument();
    expect(within(timeline).getByText("What happens next")).toBeInTheDocument();
    expect(within(timeline).getByText("Expected duration")).toBeInTheDocument();

    await user.click(within(timeline).getByRole("button", { name: /^Quotation/i }));
    expect(within(timeline).getByRole("button", { name: /^Quotation/i })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(within(timeline).getByText("Expected duration")).toBeInTheDocument();
    expect(within(timeline).getAllByText(/2–5 business days/i).length).toBeGreaterThan(0);
  });

  it("renders industries and manual testimonial controls", async () => {
    const user = userEvent.setup();
    const { industries, testimonials } = homepageFixtures;
    render(
      <>
        <IndustriesSection
          title={industries.title}
          description={industries.description}
          industries={industries.industries}
        />
        <TestimonialsSection
          title={testimonials.title}
          description={testimonials.description}
          testimonials={testimonials.testimonials}
          autoRotateMs={0}
        />
      </>,
    );

    expect(screen.getByRole("link", { name: /Energy/i })).toBeInTheDocument();
    expect(screen.getByText(/We always knew the next owner/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next testimonial" }));
    expect(screen.getByText(/Tracking stayed honest/i)).toBeInTheDocument();
    expect(screen.getByText(/Showing 2 of 2/i)).toBeInTheDocument();
  });

  it("renders why choose us reasons", () => {
    const { whyChooseUs } = homepageFixtures;
    render(
      <WhyChooseUsSection
        title={whyChooseUs.title}
        description={whyChooseUs.description}
        reasons={[...whyChooseUs.reasons]}
        primaryCta={whyChooseUs.primaryCta}
      />,
    );
    expect(screen.getByRole("heading", { name: whyChooseUs.title })).toBeInTheDocument();
    expect(screen.getByText("Named ownership")).toBeInTheDocument();
  });

  it("toggles FAQ panels accessibly and renders CTA band", async () => {
    const user = userEvent.setup();
    const { faq, cta } = homepageFixtures;
    render(
      <>
        <FaqSection
          title={faq.title}
          description={faq.description}
          items={faq.items}
          primaryCta={faq.primaryCta}
          secondaryCta={faq.secondaryCta}
        />
        <CtaSection
          title={cta.title}
          description={cta.description}
          primaryCta={cta.primaryCta}
          secondaryCta={cta.secondaryCta}
          reassurance={cta.reassurance}
        />
      </>,
    );

    const first = screen.getByRole("button", { name: faq.items[0]!.question });
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: faq.items[1]!.question }));
    expect(screen.getByRole("button", { name: faq.items[1]!.question })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    const ctaRegion = screen.getByRole("region", { name: cta.title });
    expect(within(ctaRegion).getByRole("link", { name: "Request Procurement" })).toBeInTheDocument();
  });
});
