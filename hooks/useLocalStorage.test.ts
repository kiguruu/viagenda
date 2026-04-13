import { expect, test, describe, beforeEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  const TEST_KEY = "test-key";
  const INITIAL_VALUE = { foo: "bar" };

  beforeEach(() => {
    window.localStorage.clear();
  });

  test("初期値が正しくセットされ、localStorage に保存されること", () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, INITIAL_VALUE));
    
    expect(result.current[0]).toEqual(INITIAL_VALUE);
    expect(JSON.parse(window.localStorage.getItem(TEST_KEY)!)).toEqual(INITIAL_VALUE);
  });

  test("値を更新すると localStorage も更新されること", () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, INITIAL_VALUE));
    const NEW_VALUE = { foo: "baz" };

    act(() => {
      result.current[1](NEW_VALUE);
    });

    expect(result.current[0]).toEqual(NEW_VALUE);
    expect(JSON.parse(window.localStorage.getItem(TEST_KEY)!)).toEqual(NEW_VALUE);
  });

  test("既存の localStorage の値がある場合はそれを優先すること", () => {
    const EXISTING_VALUE = { hello: "world" };
    window.localStorage.setItem(TEST_KEY, JSON.stringify(EXISTING_VALUE));

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, INITIAL_VALUE));
    
    expect(result.current[0]).toEqual(EXISTING_VALUE);
  });
});
