import { useRef } from "react";

type ClearableSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  spellCheck?: boolean;
};

export function ClearableSearchInput({
  value,
  onChange,
  placeholder,
  autoComplete = "off",
  spellCheck = false,
}: ClearableSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="search-input-wrap">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
      />
      {value ? (
        <button
          type="button"
          className="search-clear-btn"
          aria-label="Keresés törlése"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
