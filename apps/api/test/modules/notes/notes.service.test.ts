import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";

import NotesService from "../../../src/modules/notes/notes.service.js";
import NotesRepository from "../../../src/modules/notes/notes.repository.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../src/utils/http-errors.js";

describe("NotesService", () => {
  let service: NotesService;

  let repository: {
    create: sinon.SinonStub;
    findAllByUser: sinon.SinonStub;
    findBySlugAndUser: sinon.SinonStub;
    updateBySlugAndUser: sinon.SinonStub;
    deleteBySlugAndUser: sinon.SinonStub;
  };

  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    repository = {
      create: sinon.stub(),
      findAllByUser: sinon.stub(),
      findBySlugAndUser: sinon.stub(),
      updateBySlugAndUser: sinon.stub(),
      deleteBySlugAndUser: sinon.stub(),
    };

    service = new NotesService(repository as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should create the note with a generated slug", async () => {
      const data = {
        title: "My Test Note",
        content: "Test content",
      };

      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "my-test-note",
        ...data,
      };

      repository.create.resolves(note);

      const result = await service.create(userId, data);

      expect(
        repository.create.calledOnceWith(userId, "my-test-note", data),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should throw BadRequestError when the title produces an empty slug", async () => {
      const data = {
        title: "!!!",
        content: "Test content",
      };

      try {
        await service.create(userId, data);
        expect.fail("Expected BadRequestError");
      } catch (error) {
        expect(error).to.be.instanceOf(BadRequestError);
        expect((error as Error).message).to.equal("Invalid title");
      }

      expect(repository.create.called).to.equal(false);
    });

    it("should retry with a new slug when a duplicate occurs", async () => {
      const data = {
        title: "My Test Note",
        content: "Test content",
      };

      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "my-test-note-1",
        ...data,
      };

      const duplicateError = {
        code: 11000,
        keyPattern: {
          slug: 1,
        },
      };

      repository.create
        .onFirstCall()
        .rejects(duplicateError)
        .onSecondCall()
        .resolves(note);

      const result = await service.create(userId, data);

      expect(repository.create.callCount).to.equal(2);

      expect(
        repository.create.firstCall.calledWith(
          userId,
          "my-test-note",
          data,
        ),
      ).to.equal(true);

      expect(
        repository.create.secondCall.calledWith(
          userId,
          "my-test-note-1",
          data,
        ),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should retry with incrementing slugs when duplicates occur", async () => {
      const data = {
        title: "My Test Note",
        content: "Test content",
      };

      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "my-test-note-2",
        ...data,
      };

      const duplicateError = {
        code: 11000,
        keyPattern: {
          slug: 1,
        },
      };

      repository.create
        .onFirstCall()
        .rejects(duplicateError)
        .onSecondCall()
        .rejects(duplicateError)
        .onThirdCall()
        .resolves(note);

      const result = await service.create(userId, data);

      expect(repository.create.callCount).to.equal(3);

      expect(
        repository.create.firstCall.calledWith(
          userId,
          "my-test-note",
          data,
        ),
      ).to.equal(true);

      expect(
        repository.create.secondCall.calledWith(
          userId,
          "my-test-note-1",
          data,
        ),
      ).to.equal(true);

      expect(
        repository.create.thirdCall.calledWith(
          userId,
          "my-test-note-2",
          data,
        ),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should throw ConflictError after maximum retries", async () => {
      const data = {
        title: "My Test Note",
        content: "Test content",
      };

      const duplicateError = {
        code: 11000,
        keyPattern: {
          slug: 1,
        },
      };

      repository.create.rejects(duplicateError);

      try {
        await service.create(userId, data);
        expect.fail("Expected ConflictError");
      } catch (error) {
        expect(error).to.be.instanceOf(ConflictError);
        expect((error as Error).message).to.equal(
          "Failed to generate a unique slug after multiple attempts",
        );
      }

      expect(repository.create.callCount).to.equal(3);
    });

    it("should rethrow non-duplicate errors", async () => {
      const data = {
        title: "My Test Note",
        content: "Test content",
      };

      const error = new Error("Database error");

      repository.create.rejects(error);

      try {
        await service.create(userId, data);
        expect.fail("Expected error");
      } catch (err) {
        expect(err).to.equal(error);
      }

      expect(repository.create.calledOnce).to.equal(true);
    });
  });

  describe("getAll", () => {
    it("should return all notes for the user", async () => {
      const notes = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          slug: "first-note",
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          slug: "second-note",
        },
      ];

      repository.findAllByUser.resolves(notes);

      const result = await service.getAll(userId);

      expect(
        repository.findAllByUser.calledOnceWith(userId, undefined),
      ).to.equal(true);

      expect(result).to.equal(notes);
    });

    it("should pass the search term to the repository", async () => {
      const notes = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          slug: "test-note",
        },
      ];

      repository.findAllByUser.resolves(notes);

      const result = await service.getAll(userId, "test");

      expect(
        repository.findAllByUser.calledOnceWith(userId, "test"),
      ).to.equal(true);

      expect(result).to.equal(notes);
    });

    it("should rethrow repository errors", async () => {
      const error = new Error("Database error");

      repository.findAllByUser.rejects(error);

      try {
        await service.getAll(userId);
        expect.fail("Expected error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe("get", () => {
    it("should return the note by slug and user", async () => {
      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "test-note",
      };

      repository.findBySlugAndUser.resolves(note);

      const result = await service.get("test-note", userId);

      expect(
        repository.findBySlugAndUser.calledOnceWith("test-note", userId),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should throw NotFoundError when the note does not exist", async () => {
      repository.findBySlugAndUser.resolves(null);

      try {
        await service.get("test-note", userId);
        expect.fail("Expected NotFoundError");
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as Error).message).to.equal("Note not found");
      }
    });

    it("should rethrow repository errors", async () => {
      const error = new Error("Database error");

      repository.findBySlugAndUser.rejects(error);

      try {
        await service.get("test-note", userId);
        expect.fail("Expected error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe("update", () => {
    it("should update and return the note", async () => {
      const data = {
        title: "Updated Note",
        content: "Updated content",
      };

      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "test-note",
        ...data,
      };

      repository.updateBySlugAndUser.resolves(note);

      const result = await service.update("test-note", userId, data);

      expect(
        repository.updateBySlugAndUser.calledOnceWith(
          "test-note",
          userId,
          data,
        ),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should throw NotFoundError when the note does not exist", async () => {
      repository.updateBySlugAndUser.resolves(null);

      try {
        await service.update("test-note", userId, {
          title: "Updated Note",
        });

        expect.fail("Expected NotFoundError");
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as Error).message).to.equal("Note not found");
      }
    });

    it("should rethrow repository errors", async () => {
      const error = new Error("Database error");

      repository.updateBySlugAndUser.rejects(error);

      try {
        await service.update("test-note", userId, {
          title: "Updated Note",
        });

        expect.fail("Expected error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe("delete", () => {
    it("should delete and return the note", async () => {
      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "test-note",
      };

      repository.deleteBySlugAndUser.resolves(note);

      const result = await service.delete("test-note", userId);

      expect(
        repository.deleteBySlugAndUser.calledOnceWith("test-note", userId),
      ).to.equal(true);

      expect(result).to.equal(note);
    });

    it("should throw NotFoundError when the note does not exist", async () => {
      repository.deleteBySlugAndUser.resolves(null);

      try {
        await service.delete("test-note", userId);
        expect.fail("Expected NotFoundError");
      } catch (error) {
        expect(error).to.be.instanceOf(NotFoundError);
        expect((error as Error).message).to.equal("Note not found");
      }
    });

    it("should rethrow repository errors", async () => {
      const error = new Error("Database error");

      repository.deleteBySlugAndUser.rejects(error);

      try {
        await service.delete("test-note", userId);
        expect.fail("Expected error");
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
