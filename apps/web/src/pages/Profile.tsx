import axios from "axios";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import Select from "../components/Select";
import Tooltip from "../components/Tooltip";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { useNotesStore, type Note } from "../store/notes.store";
import { SortingOptions, type SortOption } from "./Home";

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

const sortNotes = (notes: Note[], sort: SortOption) => {
  return [...notes].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(a.updatedAt).getTime() -
          new Date(b.updatedAt).getTime()
        );

      case "az":
        return a.title.localeCompare(b.title);

      case "za":
        return b.title.localeCompare(a.title);

      case "updated":
      default:
        return (
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
        );
    }
  });
};

export default function Profile(): ReactElement {
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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

  const sortedNotes = useMemo(
    () => sortNotes(notes, sort),
    [notes, sort],
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          error.response?.data?.message ?? "Logout request failed",
        );
      } else {
        console.error("An unexpected error occurred");
      }
    } finally {
      logout();
      navigate("/login");
    }
  };

  const handleDelete = async () => {
    if (!deleteSlug) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteNote(deleteSlug);
      await getNotes();

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
        <div className="flex items-center gap-4">
          <img
            src={`https://api.dicebear.com/10.x/lorelei/svg?seed=${user?.id}`}
            alt="Profile"
            className="h-12 w-12 rounded-full border border-gray-300"
          />

          <div>
            <h1 className="text-xl font-semibold">
              {user?.username || "User"}
            </h1>

            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="
            rounded-md bg-black px-4 py-2
            text-sm text-white
            transition hover:bg-black/90
          "
        >
          Logout
        </button>
      </PageHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Notes</h2>

          {notes.length > 0 && (
            <Select
              value={sort}
              onChange={(value) => setSort(value as SortOption)}
              aria-label="Sort notes"
              options={SortingOptions}
            />
          )}
        </div>

        {loading && (
          <p className="text-sm text-gray-500">Loading notes...</p>
        )}

        {!loading && notes.length === 0 && (
          <div className="rounded-md border border-gray-300 p-4 text-sm text-gray-500">
            No notes yet. Create your first{" "}
            <Link to="/n/new" className="border-b">
              note
            </Link>
            .
          </div>
        )}

        {!loading && sortedNotes.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Title
                  </th>

                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Preview
                  </th>

                  <th className="w-28 px-4 py-3 text-right font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {sortedNotes.map((note) => (
                  <tr
                    key={note.slug}
                    className="group transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/n/${note.slug}`}
                        className="
                          font-medium text-gray-900
                          transition-colors hover:text-black
                        "
                      >
                        {note.title || "Untitled"}
                      </Link>
                    </td>

                    <td className="max-w-0 px-4 py-3.5">
                      <p className="truncate text-gray-500">
                        {stripHtml(note.content).slice(0, 100) ||
                          "No content"}
                      </p>
                    <td className="max-w-0 px-4 py-3.5">
                      <p className="truncate text-gray-500">
                        {stripHtml(note.content).slice(0, 100) ||
                          "No content"}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip text="View">
                          <Link
                            to={`/n/${note.slug}`}
                            aria-label="View note"
                            className="
                              flex h-8 w-8 items-center justify-center
                              rounded-md text-gray-500
                              transition hover:bg-gray-100 hover:text-gray-900
                            "
                          >
                            <Eye size={15} />
                          </Link>
                        </Tooltip>

                        <Tooltip text="Edit">
                          <Link
                            to={`/n/${note.slug}/edit`}
                            aria-label="Edit note"
                            className="
                              flex h-8 w-8 items-center justify-center
                              rounded-md text-gray-500
                              transition hover:bg-gray-100 hover:text-gray-900
                            "
                          >
                            <Pencil size={15} />
                          </Link>
                        </Tooltip>

                        <Tooltip text="Delete">
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteSlug(note.slug);
                            }}
                            aria-label="Delete note"
                            className="
                              flex h-8 w-8 items-center justify-center
                              rounded-md text-gray-400
                              transition hover:bg-red-50 hover:text-red-600
                            "
                          >
                            <Trash2 size={15} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
