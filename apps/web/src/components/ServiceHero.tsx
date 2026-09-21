import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ButtonLink } from "@hamd/ui/primitives";
import "../styles/service-pages.css";

type Props = {
  business: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageSet: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  highlights: string[];
};

/** Only the current service's image is mounted and prioritized. */
export function ServiceHero(props: Props) {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, pathname]);
  return (
    <section className="service-hero" aria-labelledby="service-title">
      <img className="service-hero__image" src={props.image} srcSet={props.imageSet} sizes="(max-width: 600px) 100vw, (max-width: 959px) 80vw, 65vw" alt="" width={1920} height={1280} fetchPriority="high" loading="eager" decoding="async" />
      <div className="service-hero__wash" aria-hidden="true" />
      <div className="commerce-wrap service-hero__inner">
        <div className="service-hero__copy">
          <p className="commerce-eyebrow">{props.eyebrow}</p>
          <p className="service-hero__business">{props.business}</p>
          <h1 id="service-title">{props.title}</h1>
          <p className="service-hero__description">{props.description}</p>
          <div className="commerce-actions">
            <ButtonLink href={props.primary.href}>{props.primary.label}</ButtonLink>
            <ButtonLink href={props.secondary.href} variant="secondary">{props.secondary.label}</ButtonLink>
          </div>
          <ul className="service-hero__highlights">{props.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

export function ServiceProcess({ title, steps }: { title: string; steps: { title: string; description: string; href?: string }[] }) {
  return <section className="commerce-wrap service-section" id="how-it-works">
    <p className="commerce-eyebrow">A clear path forward</p>
    <h2>{title}</h2>
    <ol className="service-process">{steps.map((step, index) => <li key={step.title}>
      <span className="service-process__number" aria-hidden="true">0{index + 1}</span>
      <h3>{step.href ? <a href={step.href}>{step.title}</a> : step.title}</h3>
      <p>{step.description}</p>
    </li>)}</ol>
  </section>;
}
