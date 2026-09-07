import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";

import NotesController from "../../../src/modules/notes/notes.controller.js";
import { sendResponse } from "../../../src/utils/send-response.js";

describe("NotesController", () => {
  let controller: NotesController;

  let service: {
    create: sinon.SinonStub;
    getAll: sinon.SinonStub;
    get: sinon.SinonStub;
    update: sinon.SinonStub;
    delete: sinon.SinonStub;
  };

  let req: any;
  let res: any;

  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    service = {
      create: sinon.stub(),
      getAll: sinon.stub(),
      get: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    };

    controller = new NotesController(service as any);

    req = {
      body: {},
      query: {},
      params: {},
      user: {
        _id: userId,
      },
    };

    res = {};
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("create", () => {
    it("should create the note successfully", async () => {
      const body = {
        title: "Test Note",
        content: "Test content",
      };

      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "test-note",
        ...body,
      };

      req.body = body;
      service.create.resolves(note);

      const sendResponseStub = sinon.stub(
        { sendResponse },
        "sendResponse",
      );

      await controller.create(req, res);

      expect(service.create.calledOnceWith(userId, body)).to.equal(true);
      expect(
        sendResponseStub.calledOnceWith(
          res,
          201,
          note,
          "Note created successfully",
        ),
      ).to.equal(true);
    });
  });

  describe("getAll", () => {
    it("should get all notes without a search query", async () => {
      const notes = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          slug: "test-note",
        },
      ];

      service.getAll.resolves(notes);

      const sendResponseStub = sinon.stub(
        { sendResponse },
        "sendResponse",
      );

      await controller.getAll(req, res);

      expect(service.getAll.calledOnceWith(userId, undefined)).to.equal(true);
      expect(sendResponseStub.calledOnceWith(res, 200, notes)).to.equal(true);
    });

    it("should pass the search query to the service", async () => {
      const notes = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId,
          slug: "test-note",
        },
      ];

      req.query.search = "test";
      service.getAll.resolves(notes);

      const sendResponseStub = sinon.stub(
        { sendResponse },
        "sendResponse",
      );

      await controller.getAll(req, res);

      expect(service.getAll.calledOnceWith(userId, "test")).to.equal(true);
      expect(sendResponseStub.calledOnceWith(res, 200, notes)).to.equal(true);
    });

    it("should ignore a non-string search query", async () => {
      req.query.search = ["test", "note"];

      service.getAll.resolves([]);

      await controller.getAll(req, res);

      expect(service.getAll.calledOnceWith(userId, undefined)).to.equal(true);
    });
  });

  describe("get", () => {
    it("should get a note by slug", async () => {
      const note = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "test-note",
      };

      req.params.slug = "test-note";
      service.get.resolves(note);

      const sendResponseStub = sinon.stub(
        { sendResponse },
        "sendResponse",
      );

      await controller.get(req, res);

      expect(service.get.calledOnceWith("test-note", userId)).to.equal(true);
      expect(sendResponseStub.calledOnceWith(res, 200, note)).to.equal(true);
    });
  });

  describe("update", () => {
    it("should update the note successfully", async () => {
      const body = {
        title: "Updated Note",
        content: "Updated content",
      };

      const updated = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        slug: "test-note",
        ...body,
      };

      req.params.slug = "test-note";
      req.body = body;

      service.update.resolves(updated);

      const sendResponseStub = sinon.stub(
        { sendResponse },
        "sendResponse",
      );

      await controller.update(req, res);

      expect(
        service.update.calledOnceWith("test-note", userId, body),
      ).to.equal(true);

      expect(
        sendResponseStub.calledOnceWith(
          res,
          200,
          updated,
          "Note updated successfully",
        ),
      ).to.equal(true);
    });
  });

  describe("delete", () => {
    it("should delete the note successfully", async () => {
      req.params.slug = "test-note";

      service.delete.resolves();

      const sendResponseStub = sinon.stub(
        { sendResponse },
        "sendResponse",
      );

      await controller.delete(req, res);

      expect(
        service.delete.calledOnceWith("test-note", userId),
      ).to.equal(true);

      expect(
        sendResponseStub.calledOnceWith(
          res,
          200,
          null,
          "Note deleted successfully",
        ),
      ).to.equal(true);
    });
  });
});
