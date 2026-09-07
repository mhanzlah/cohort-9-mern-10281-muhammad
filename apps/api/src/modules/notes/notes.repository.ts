import mongoose from "mongoose";
import Note from "./notes.model.js";
import {
  CreateNoteInput,
  NoteDocument,
  UpdateNoteInput,
} from "./notes.types.js";

export default class NotesRepository {
  create = async (
    userId: mongoose.Types.ObjectId,
    slug: string,
    data: CreateNoteInput,
  ): Promise<NoteDocument> => {
    return Note.create({ userId, slug, ...data });
  };

  findAllByUser = async (
    userId: mongoose.Types.ObjectId,
    search?: string,
  ): Promise<NoteDocument[]> => {
    const filter: Record<string, unknown> = { userId };

    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
      ];
    }

    return Note.find(filter).sort({ updatedAt: -1 });
  };

  findByIdAndUser = async (
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
  ): Promise<NoteDocument | null> => {
    return Note.findOne({ _id: id, userId });
  };

  findBySlugAndUser = async (
    slug: string,
    userId: mongoose.Types.ObjectId,
  ): Promise<NoteDocument | null> => {
    return Note.findOne({ slug, userId });
  };

  updateBySlugAndUser = async (
    slug: string,
    userId: mongoose.Types.ObjectId,
    data: UpdateNoteInput,
  ): Promise<NoteDocument | null> => {
    return Note.findOneAndUpdate({ slug, userId }, data, {
      returnDocument: "after",
    });
  };

  deleteBySlugAndUser = async (
    slug: string,
    userId: mongoose.Types.ObjectId,
  ): Promise<NoteDocument | null> => {
    return Note.findOneAndDelete({ slug, userId });
  };
}
