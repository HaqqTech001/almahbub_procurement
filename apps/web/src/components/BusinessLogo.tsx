import { BUSINESS_LOGOS } from "../content/business-logos.js";
import { PresentationImage } from "./PresentationImage.js";
import "../styles/business-logo.css";

export function BusinessLogo({ business, className = "" }: { business: keyof typeof BUSINESS_LOGOS; className?: string }) {
  const logo = BUSINESS_LOGOS[business];
  return <div className={`business-logo ${className}`}><PresentationImage src={logo.src} alt={logo.alt} loading="eager" /></div>;
}
