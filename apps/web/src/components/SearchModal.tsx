import { Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import { useNotesStore } from "../store/notes.store";

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

export default function SearchModal({
  isOpen,
  setIsOpen,
}: Props): ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const searchResults = useNotesStore((s) => s.searchResults);
  const searching = useNotesStore((s) => s.searching);
  const searchNotes = useNotesStore((s) => s.searchNotes);
  const clearSearch = useNotesStore((s) => s.clearSearch);

  const [query, setQuery] = useState("");

  // Global shortcuts: Ctrl/Cmd + K and /
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "/") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [setIsOpen]);

  // Modal focus, escape, and focus trapping
  // Modal focus, escape, and focus trapping
  useEffect(() => {
    if (!isOpen) {
      clearSearch();
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    setQuery("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button, input, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen, clearSearch]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
      previouslyFocusedElement.current = null;
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const value = query.trim();

    const timeout = setTimeout(() => {
      searchNotes(value);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, isOpen, searchNotes]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="
        fixed inset-0 z-50
        flex items-start justify-center
        pt-24
        bg-black/30
        backdrop-blur-sm
      "
      onClick={() => setIsOpen(false)}
    >
      <div
        ref={modalRef}
        className="
          w-full max-w-md
          overflow-hidden
          bg-white
          rounded-xl
          border border-gray-200
          shadow-lg
        "
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="search-modal-title" className="sr-only">
          Search notes
        </h2>

        <div className="flex items-center border-b border-gray-200 px-4">
          <Search
            size={16}
            aria-hidden="true"
            className="shrink-0 text-gray-500"
          />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search notes"
            placeholder="Search notes..."
            autoComplete="off"
            className="
              w-full
              px-3 py-3
              text-sm
              outline-none
              bg-transparent
            "
          />
        </div>

        <p className="text-xs text-gray-400 px-4 py-2 text-center">
          In Development...
        </p>

        <div className="flex text-xs text-gray-500 px-4 py-2 border-t border-gray-300 justify-between">
          <span>
            <kbd className="px-1 border rounded">Ctrl</kbd> +{" "}
            <kbd className="px-1 border rounded">K</kbd>
          </span>

          <span>
            <kbd className="px-1 border rounded">Esc</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
