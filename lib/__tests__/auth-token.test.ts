import { clearAccessToken, getAccessToken, setAccessToken } from "../auth-token";

describe("auth-token helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("stores and retrieves token from sessionStorage", () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken("abc");
    expect(getAccessToken()).toBe("abc");
  });

  it("clears token", () => {
    setAccessToken("abc");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
