import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

import FormField from "../../components/FormField";
import PageHeader from "../../components/PageHeader";
import RichEditor from "../../components/RichEditor";
import { useNotesStore } from "../../store/notes.store";
import {
  updateNoteSchema,
  type UpdateNoteInput,
} from "../../validation/notes.validation";
import NotFound from "../NotFound";

export default function NoteEdit(): ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const notes = useNotesStore((state) => state.notes);
  const getNote = useNotesStore((state) => state.getNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const loading = useNotesStore((state) => state.loading);

  const note = notes.find((item) => item.slug === slug);

  const [content, setContent] = useState("");
  const [fetchingNote, setFetchingNote] = useState(!note);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateNoteInput>({
    resolver: zodResolver(updateNoteSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (!slug) {
      setFetchingNote(false);
      setNotFound(true);
      return;
    }

    if (note) {
      setFetchingNote(false);
      setNotFound(false);
      setFetchError(null);
      return;
    }

    let cancelled = false;

    const fetchNote = async () => {
      setFetchingNote(true);
      setNotFound(false);
      setFetchError(null);

      try {
        await getNote(slug);
      } catch (error: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setNotFound(true);
        } else {
          setFetchError(
            "Failed to load the note. Please check your connection and try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setFetchingNote(false);
        }
      }
    };

    void fetchNote();

    return () => {
      cancelled = true;
    };
  }, [slug, note, getNote]);

  useEffect(() => {
    if (!note) return;

    reset({
      title: note.title,
      content: note.content,
    });

    setContent(note.content || "");
  }, [note, reset]);

  const handleRetry = () => {
    if (!slug) return;

    setFetchingNote(true);
    setNotFound(false);
    setFetchError(null);

    const retry = async () => {
      try {
        await getNote(slug);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setNotFound(true);
        } else {
          setFetchError(
            "Failed to load the note. Please check your connection and try again.",
          );
        }
      } finally {
        setFetchingNote(false);
      }
    };

    void retry();
  };

  const onSubmit = async (data: UpdateNoteInput) => {
    if (!note) return;

    setUpdateError(null);

    try {
      await updateNote(note.slug, {
        title: data.title,
        content,
      });

      navigate(`/n/${note.slug}`);
    } catch (error: unknown) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : "Failed to update the note. Please try again.",
      );
    }
  };

  if (fetchingNote || (loading && !note)) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading note...</p>
      </div>
    );
  }

  if (notFound) {
    return <NotFound message="The note you are looking for does not exist." />;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-red-500">{fetchError}</p>

        <button
          type="button"
          onClick={handleRetry}
          className="
            mt-4
            rounded-md
            bg-black
            px-4 py-2
            text-sm
            text-white
            transition
            hover:bg-gray-800
          "
        >
          Try again
        </button>
      </div>
    );
  }

  if (!note) {
    return <NotFound message="The note you are looking for does not exist." />;
  }

  const saving = isSubmitting || loading;

  return (
    <>
      <PageHeader>
        <h1 className="text-xl font-semibold">Edit Note</h1>

        <div className="flex items-center gap-2">
          <Link
            to={`/n/${note.slug}`}
            className="
              rounded-md
              border border-gray-300
              px-4 py-2
              text-sm
              transition
              hover:bg-gray-50
            "
          >
            Cancel
          </Link>

          <button
            type="submit"
            form="note-edit-form"
            disabled={saving}
            className="
              rounded-md
              bg-black
              px-4 py-2
              text-sm
              text-white
              transition
              hover:bg-black/90
              disabled:opacity-50
            "
          >
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </PageHeader>

      <form
        id="note-edit-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          placeholder="Untitled note"
          className="
            w-full
            border-none
            bg-transparent
            px-0
            text-2xl
            font-semibold
            outline-none
            placeholder:text-gray-300
            focus:outline-none
            focus:ring-0
          "
          type="text"
          registration={register("title")}
          error={errors.title?.message}
        />

        <div className="overflow-hidden rounded-md border border-gray-300 bg-white">
          <RichEditor
            value={content}
            onChange={(value) => {
              setContent(value);

              setValue("content", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </div>

        {errors.content && (
          <p className="text-xs text-red-500">{errors.content.message}</p>
        )}

        {updateError && (
          <p role="alert" className="text-sm text-red-500">
            {updateError}
          </p>
        )}
      </form>
    </>
  );
}
