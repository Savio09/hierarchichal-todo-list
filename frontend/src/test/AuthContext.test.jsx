/**
 * Unit tests for AuthContext
 * Tests authentication state management and localStorage integration
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

describe("AuthContext", () => {
  beforeEach(() => {
    // Clear localStorage mocks before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should provide auth context", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.login).toBeInstanceOf(Function);
    expect(result.current.logout).toBeInstanceOf(Function);
    expect(result.current.isAuthenticated).toBeInstanceOf(Function);
  });

  it("should initially have no user", () => {
    localStorage.getItem.mockReturnValue(null);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated()).toBe(false);
  });

  it("should restore user from localStorage on mount", () => {
    const mockToken = "mock-jwt-token";
    const mockUser = { id: 1, username: "testuser", email: "test@example.com" };

    localStorage.getItem.mockImplementation((key) => {
      if (key === "access_token") return mockToken;
      if (key === "user") return JSON.stringify(mockUser);
      return null;
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual({ token: mockToken, ...mockUser });
    expect(result.current.isAuthenticated()).toBe(true);
  });

  it("should handle login correctly", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockToken = "new-token";
    const mockUser = { id: 2, username: "newuser", email: "new@example.com" };

    act(() => {
      result.current.login(mockToken, mockUser);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "access_token",
      mockToken
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockUser)
    );
    expect(result.current.user).toEqual({ token: mockToken, ...mockUser });
    expect(result.current.isAuthenticated()).toBe(true);
  });

  it("should handle logout correctly", () => {
    const mockToken = "token-to-remove";
    const mockUser = { id: 1, username: "testuser" };

    localStorage.getItem.mockImplementation((key) => {
      if (key === "access_token") return mockToken;
      if (key === "user") return JSON.stringify(mockUser);
      return null;
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    // User should be loaded initially
    expect(result.current.isAuthenticated()).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated()).toBe(false);
  });

  it("should handle corrupted user data in localStorage", () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === "access_token") return "some-token";
      if (key === "user") return "invalid-json";
      return null;
    });

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Should handle error gracefully
    expect(result.current.user).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
  });

  it("should throw error when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("should update isAuthenticated after login and logout", () => {
    localStorage.getItem.mockReturnValue(null);

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially not authenticated
    expect(result.current.isAuthenticated()).toBe(false);

    // Login
    act(() => {
      result.current.login("token", { id: 1, username: "test" });
    });

    expect(result.current.isAuthenticated()).toBe(true);

    // Logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated()).toBe(false);
  });

  it("should maintain authentication state across component re-renders", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result, rerender } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login("persistent-token", { id: 1, username: "test" });
    });

    expect(result.current.isAuthenticated()).toBe(true);

    // Re-render
    rerender();

    expect(result.current.isAuthenticated()).toBe(true);
    expect(result.current.user.token).toBe("persistent-token");
  });
});
