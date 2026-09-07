import { Filter, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import NoteCard from "../components/NoteCard";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import { useNotesStore } from "../store/notes.store";

export type SortOption = "updated" | "oldest" | "az" | "za";

export const SortingOptions = [
  { value: "updated", label: "Recently updated" },
  { value: "oldest", label: "Oldest updated" },
  { value: "az", label: "A-Z (Title)" },
  { value: "za", label: "Z-A (Title)" },
];

export default function Home(): ReactElement {
  const notes = useNotesStore((s) => s.notes);
  const getNotes = useNotesStore((s) => s.getNotes);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const loading = useNotesStore((s) => s.loading);

  const [sort, setSort] = useState<SortOption>("updated");
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    getNotes();
  }, [getNotes]);

  const filteredNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );

        case "az":
          return a.title.localeCompare(b.title);

        case "za":
          return b.title.localeCompare(a.title);

        case "updated":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });
  }, [notes, sort]);

  const handleDelete = async () => {
    if (!deleteSlug) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteNote(deleteSlug);
      setDeleteSlug(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete note. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader>
        <h1 className="text-xl font-semibold">Your Notes</h1>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Filter
              size={14}
              className="pointer-events-none absolute left-2.5 text-gray-500"
            />

            <Select
              value={sort}
              aria-label="Sort notes"
              options={SortingOptions}
              onChange={(value) => setSort(value as SortOption)}
            />
          </div>

          <Link
            to="/n/new"
            className="
              flex items-center gap-1
              rounded-md bg-black px-3 py-2
              text-sm text-white
              transition hover:bg-black/90
            "
          >
            <Plus size={16} />
            New Note
          </Link>
        </div>
      </PageHeader>

      {loading && <p className="text-sm text-gray-500">Loading notes...</p>}

      {!loading && notes.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <NoteCard key={note.slug} note={note} onDelete={setDeleteSlug} />
          ))}
        </div>
      )}

      {!loading && notes.length === 0 && (
        <p className="text-sm text-gray-500">
          No notes yet. Create your first note.
        </p>
      )}

      <ConfirmModal
        isOpen={deleteSlug !== null}
        setIsOpen={(isOpen) => {
          if (!isOpen && !deleting) {
            setDeleteSlug(null);
            setDeleteError(null);
          }
        }}
        loading={deleting}
        onConfirm={handleDelete}
        error={deleteError}
      />
    </>
  );
}
