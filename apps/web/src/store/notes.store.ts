import axios from "axios";
import axios from "axios";
import { create } from "zustand";

import { api } from "../api/axios";

export type Note = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  data: T;
};

type ApiError = {
  message: string;
};

type NotesState = {
  notes: Note[];
  note: Note | null;
  searchResults: Note[];
  loading: boolean;
  searching: boolean;
  error: string | null;

  createNote: (data: { title: string; content: string }) => Promise<void>;
  getNotes: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  getNote: (slug: string) => Promise<Note | void>;
  updateNote: (
    slug: string,
    data: {
      title?: string;
      content?: string;
    },
  ) => Promise<void>;
  deleteNote: (slug: string) => Promise<void>;

  clearSearch: () => void;
  clearError: () => void;
};

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  note: null,
  searchResults: [],

  loading: false,
  searching: false,
  error: null,

  getNotes: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await api.get<ApiResponse<Note[]>>("/notes");

      set({
        notes: res.data.data,
        loading: false,
      });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to fetch notes"),
        loading: false,
      });

      throw error;
    }
  },

  searchNotes: async (query) => {
    const value = query.trim();

    if (!value) {
      set({ searchResults: [] });
      return;
    }

    const requestId = ++searchRequestId;

    set({
      searching: true,
      error: null,
    });

    try {
      const res = await api.get<ApiResponse<Note[]>>("/notes", {
        params: {
          search: value,
        },
      });

      if (requestId !== searchRequestId) {
        return;
      }

      set({
        searchResults: res.data.data,
        searching: false,
      });
    } catch (error: unknown) {
      if (requestId !== searchRequestId) {
        return;
      }

      set({
        error: getErrorMessage(error, "Failed to search notes"),
        searching: false,
      });
    }
  },

  getNote: async (slug) => {
    set({
      loading: true,
      error: null,
    });

    try {
      const res = await api.get<ApiResponse<Note>>(`/notes/${slug}`);
      const note = res.data.data;

      set((state) => ({
        notes: state.notes.some((n) => n.slug === note.slug)
          ? state.notes.map((n) => (n.slug === note.slug ? note : n))
          : [...state.notes, note],
        note,
        loading: false,
      }));
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to fetch note"),
        loading: false,
      });

      throw error;
    }
  },

  createNote: async (data) => {
    set({
      error: null,
    });

    try {
      const res = await api.post<ApiResponse<Note>>("/notes", data);
      const note = res.data.data;

      set((state) => ({
        notes: [note, ...state.notes],
      }));
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to create note"),
      });

      throw error;
    }
  },

  updateNote: async (slug, data) => {
    set({
      error: null,
    });

    try {
      const res = await api.patch<ApiResponse<Note>>(`/notes/${slug}`, data);
      const note = res.data.data;

      set((state) => ({
        notes: state.notes.map((item) => (item.slug === slug ? note : item)),
        searchResults: state.searchResults.map((item) =>
          item.slug === slug ? note : item,
        ),
        note,
      }));
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to update note"),
        error: getErrorMessage(error, "Failed to update note"),
      });

      throw error;
    }
  },

  deleteNote: async (slug) => {
    set({
      error: null,
    });

    try {
      await api.delete(`/notes/${slug}`);

      set((state) => ({
        notes: state.notes.filter((note) => note.slug !== slug),
        searchResults: state.searchResults.filter((note) => note.slug !== slug),
        note: state.note?.slug === slug ? null : state.note,
      }));
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, "Failed to delete note"),
      });

      throw error;
    }
  },

  clearSearch: () => {
    searchRequestId++;

    set({
      searchResults: [],
      searching: false,
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
