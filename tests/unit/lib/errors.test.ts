import {
  AppError,
  NotFoundError,
  ConflictError,
} from "../../../src/lib/errors.js";

describe("AppError", () => {
  it("sets statusCode and message", () => {
    const err = new AppError(422, "something went wrong");
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("something went wrong");
  });

  it("has name 'AppError'", () => {
    expect(new AppError(400, "bad").name).toBe("AppError");
  });

  it("is instanceof Error", () => {
    expect(new AppError(400, "bad")).toBeInstanceOf(Error);
  });
});

describe("NotFoundError", () => {
  it("formats message with resource and id", () => {
    const err = new NotFoundError("Fund", "abc");
    expect(err.message).toBe("Fund with id abc not found");
  });

  it("has statusCode 404", () => {
    expect(new NotFoundError("Fund", "abc").statusCode).toBe(404);
  });

  it("has name 'NotFoundError'", () => {
    expect(new NotFoundError("Fund", "abc").name).toBe("NotFoundError");
  });

  it("is instanceof AppError", () => {
    expect(new NotFoundError("Fund", "abc")).toBeInstanceOf(AppError);
  });
});

describe("ConflictError", () => {
  it("has statusCode 409", () => {
    expect(new ConflictError("duplicate").statusCode).toBe(409);
  });

  it("stores message", () => {
    expect(new ConflictError("duplicate").message).toBe("duplicate");
  });

  it("is instanceof AppError", () => {
    expect(new ConflictError("duplicate")).toBeInstanceOf(AppError);
  });
});
