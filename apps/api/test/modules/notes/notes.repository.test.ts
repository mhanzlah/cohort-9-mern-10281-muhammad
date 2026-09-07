import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";

import NotesRepository from "../../../src/modules/notes/notes.repository.js";
import Note from "../../../src/modules/notes/notes.model.js";

describe("NotesRepository", () => {
  let repository: NotesRepository;

  const userId = new mongoose.Types.ObjectId();
  const noteId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    repository = new NotesRepository();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should create a note", async () => {
      const data = {
        title: "Test Note",
        content: "Test content",
      };

      const note = {
        _id: noteId,
        userId,
        slug: "test-note",
        ...data,
      };

      const createStub = sinon.stub(Note, "create").resolves(note as any);

      const result = await repository.create(userId, "test-note", data);

      expect(createStub.calledOnce).to.equal(true);

      expect(createStub.firstCall.args[0]).to.deep.equal({
        userId,
        slug: "test-note",
        ...data,
      });

      expect(result).to.equal(note);
    });
  });

  describe("findAllByUser", () => {
    it("should find all notes for a user", async () => {
      const notes = [
        {
          _id: noteId,
          userId,
          title: "Test Note",
        },
      ];

      const sortStub = sinon.stub().resolves(notes);

      sinon.stub(Note, "find").returns({
        sort: sortStub,
      } as any);

      const result = await repository.findAllByUser(userId);

      expect(Note.find.calledOnceWith({ userId })).to.equal(true);
      expect(sortStub.calledOnceWith({ updatedAt: -1 })).to.equal(true);
      expect(result).to.equal(notes);
    });

    it("should search notes by title or content", async () => {
      const notes = [
        {
          _id: noteId,
          userId,
          title: "Test Note",
          content: "Some content",
        },
      ];

      const sortStub = sinon.stub().resolves(notes);

      sinon.stub(Note, "find").returns({
        sort: sortStub,
      } as any);

      const result = await repository.findAllByUser(userId, "  test  ");

      expect(
        Note.find.calledOnceWith({
          userId,
          $or: [
            {
              title: {
                $regex: "test",
                $options: "i",
              },
            },
            {
              content: {
                $regex: "test",
                $options: "i",
              },
            },
          ],
        }),
      ).to.equal(true);

      expect(sortStub.calledOnceWith({ updatedAt: -1 })).to.equal(true);
      expect(result).to.equal(notes);
    });

    it("should not add search filter when search is empty", async () => {
      const notes: any[] = [];

      const sortStub = sinon.stub().resolves(notes);

      sinon.stub(Note, "find").returns({
        sort: sortStub,
      } as any);

      await repository.findAllByUser(userId, "   ");

      expect(Note.find.calledOnceWith({ userId })).to.equal(true);
    });
  });

  describe("findByIdAndUser", () => {
    it("should find a note by id and user", async () => {
      const note = {
        _id: noteId,
        userId,
        title: "Test Note",
      };

      const findOneStub = sinon.stub(Note, "findOne").resolves(note as any);

      const result = await repository.findByIdAndUser(noteId, userId);

      expect(
        findOneStub.calledOnceWith({
          _id: noteId,
          userId,
        }),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should return null when note is not found", async () => {
      const findOneStub = sinon.stub(Note, "findOne").resolves(null);

      const result = await repository.findByIdAndUser(noteId, userId);

      expect(
        findOneStub.calledOnceWith({
          _id: noteId,
          userId,
        }),
      ).to.equal(true);

      expect(result).to.equal(null);
    });
  });

  describe("findBySlugAndUser", () => {
    it("should find a note by slug and user", async () => {
      const note = {
        _id: noteId,
        userId,
        slug: "test-note",
      };

      const findOneStub = sinon.stub(Note, "findOne").resolves(note as any);

      const result = await repository.findBySlugAndUser("test-note", userId);

      expect(
        findOneStub.calledOnceWith({
          slug: "test-note",
          userId,
        }),
      ).to.equal(true);

      expect(result).to.equal(note);
    });
  });

  describe("updateBySlugAndUser", () => {
    it("should update a note by slug and user", async () => {
      const data = {
        title: "Updated Note",
        content: "Updated content",
      };

      const note = {
        _id: noteId,
        userId,
        slug: "test-note",
        ...data,
      };

      const findOneAndUpdateStub = sinon
        .stub(Note, "findOneAndUpdate")
        .resolves(note as any);

      const result = await repository.updateBySlugAndUser(
        "test-note",
        userId,
        data,
      );

      expect(
        findOneAndUpdateStub.calledOnceWith(
          {
            slug: "test-note",
            userId,
          },
          data,
          {
            returnDocument: "after",
          },
        ),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should return null when note is not found", async () => {
      const findOneAndUpdateStub = sinon
        .stub(Note, "findOneAndUpdate")
        .resolves(null);

      const result = await repository.updateBySlugAndUser("test-note", userId, {
        title: "Updated Note",
      });

      expect(findOneAndUpdateStub.calledOnce).to.equal(true);
      expect(result).to.equal(null);
    });
  });

  describe("deleteBySlugAndUser", () => {
    it("should delete a note by slug and user", async () => {
      const note = {
        _id: noteId,
        userId,
        slug: "test-note",
      };

      const findOneAndDeleteStub = sinon
        .stub(Note, "findOneAndDelete")
        .resolves(note as any);

      const result = await repository.deleteBySlugAndUser("test-note", userId);

      expect(
        findOneAndDeleteStub.calledOnceWith({
          slug: "test-note",
          userId,
        }),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should return null when note is not found", async () => {
      const findOneAndDeleteStub = sinon
        .stub(Note, "findOneAndDelete")
        .resolves(null);

      const result = await repository.deleteBySlugAndUser("test-note", userId);

      expect(findOneAndDeleteStub.calledOnce).to.equal(true);
      expect(result).to.equal(null);
    });
  });
});
