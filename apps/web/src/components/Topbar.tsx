import { FileText, Home, Pencil, Plus, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";

import { useNotesStore } from "../store/notes.store";

type RouteMeta = {
  label: string;
  icon?: LucideIcon;
};

const routeMeta: Record<string, RouteMeta> = {
  profile: { label: "Profile", icon: User },
  new: { label: "New note", icon: Plus },
  edit: { label: "Edit", icon: Pencil },
  "404": { label: "404" },
};

export default function TopBar(): ReactElement {
  const { pathname } = useLocation();
  const notes = useNotesStore((s) => s.notes);

  const paths = pathname.split("/").filter(Boolean);

  const isHome = paths.length === 0;
  const isNoteRoute = paths[0] === "n";
  const is404 = paths[0] === "404";

  const items: {
    label: string;
    icon?: LucideIcon;
    url: string;
  }[] = [];

  if (is404) {
    items.push({
      label: "404",
      url: "/404",
    });
  } else if (isNoteRoute) {
    const slug = paths[1];

    if (slug === "new") {
      items.push({
        label: "New note",
        icon: Plus,
        url: "/n/new",
      });
    } else if (slug) {
      const note = notes.find((note) => note.slug === slug);

      items.push({
        label: "Notes",
        icon: FileText,
        url: "/",
      });

      items.push({
        label: note?.title || "Note",
        url: `/n/${slug}`,
      });

      if (paths[2] === "edit") {
        items.push({
          label: "Edit",
          icon: Pencil,
          url: `/n/${slug}/edit`,
        });
      }
    }
  } else if (paths[0]) {
    const segment = paths[0];
    const meta = routeMeta[segment];

    items.push({
      label: meta?.label ?? "404",
      icon: meta?.icon,
      url: meta ? `/${segment}` : "/404",
    });
  }

  return (
    <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
      <nav className="flex items-center text-sm text-gray-500">
        <Link
          to="/"
          className={`flex items-center gap-1 transition ${
            isHome ? "font-medium text-black" : "hover:text-black"
          }`}
        >
          <Home size={14} />
          Home
        </Link>

        {items.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === items.length - 1;

          return (
            <div
              key={`${item.url}-${index}`}
              className="flex items-center"
            >
              <span className="mx-2 text-gray-300">/</span>

              {isLast ? (
                <span className="flex items-center gap-1 font-medium text-black">
                  {Icon && <Icon size={14} />}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.url}
                  className="flex items-center gap-1 transition hover:text-black"
                >
                  {Icon && <Icon size={14} />}
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
