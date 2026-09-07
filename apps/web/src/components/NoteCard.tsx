import { Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import Tooltip from "./Tooltip";
import type { Note } from "../store/notes.store";
import { formatDate } from "../utils/formatDate";

type Props = {
  note: Note;
  onDelete: (slug: string) => void;
};

export default function NoteCard({ note, onDelete }: Props) {
  return (
    <article
      className="
        group relative
        flex flex-col
        min-h-48
        bg-white
        border border-gray-200
        rounded-xl
        p-5
        transition-all duration-200
        hover:border-gray-300
        hover:shadow-sm
      "
    >
      <Link
        to={`/n/${note.slug}`}
        className="
          flex flex-col flex-1
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-black/20
          rounded-md
        "
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold text-base text-gray-900 line-clamp-2">
            {note.title || "Untitled"}
          </h2>

          <div className="w-16 shrink-0" />
        </div>

        <div
          className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3"
          dangerouslySetInnerHTML={{
            __html: note.content || "<p>No content</p>",
          }}
        />

        <div className="mt-auto pt-5">
          <p className="text-xs text-gray-400">
            Updated {formatDate(note.updatedAt) || "recently"}
          </p>
        </div>
      </Link>

      <div
        className="
          absolute top-4 right-4
          flex items-center gap-1
          opacity-0
          group-hover:opacity-100
          group-focus-within:opacity-100
          transition-opacity
        "
      >
        <Tooltip text="Edit">
          <Link
            to={`/n/${note.slug}/edit`}
            aria-label="Edit note"
            className="
              flex items-center justify-center
              w-8 h-8
              rounded-md
              bg-white
              border border-gray-200
              text-gray-500
              hover:text-gray-900
              hover:bg-gray-50
              transition
            "
          >
            <Edit2 size={14} />
          </Link>
        </Tooltip>

        <Tooltip text="Delete">
          <button
            type="button"
            onClick={() => onDelete(note.slug)}
            aria-label="Delete note"
            className="
              flex items-center justify-center
              w-8 h-8
              rounded-md
              bg-white
              border border-gray-200
              text-gray-400
              hover:text-red-600
              hover:bg-red-50
              hover:border-red-100
              transition
            "
          >
            <Trash2 size={14} />
          </button>
        </Tooltip>
      </div>
    </article>
  );
}
