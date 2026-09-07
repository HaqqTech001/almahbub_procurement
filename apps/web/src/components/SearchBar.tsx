import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { cx } from "./cx.js";

export type SearchBarProps = {
  action?: string | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  initialQuery?: string | undefined;
};

export function SearchBar({
  action = "/products",
  placeholder = "Search products and capabilities",
  className,
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `${action}?q=${encodeURIComponent(q)}` : action);
  };

  return (
    <form className={cx("hamd-search-bar", className)} onSubmit={onSubmit} role="search">
      <label className="hamd-search-bar__label" htmlFor="site-search">
        Search
      </label>
      <div className="hamd-search-bar__row">
        <input
          id="site-search"
          className="hamd-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
        <button type="submit" className="hamd-btn hamd-btn--primary">
          Search
        </button>
      </div>
    </form>
  );
}
