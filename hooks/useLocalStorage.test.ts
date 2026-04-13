import { expect, test, describe, beforeEach } from "bun:test";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  const TEST_KEY = "test-key";
  const INITIAL_VALUE = { foo: "bar" };

  beforeEach(() => {
    window.localStorage.clear();
  });

  test("初期値が正しくセットされること（初回は localStorage に保存されない）", () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, INITIAL_VALUE));
    
    expect(result.current[0]).toEqual(INITIAL_VALUE);
    // 新しい仕様では初回レンダリング時は保存されない
    expect(window.localStorage.getItem(TEST_KEY)).toBeNull();
  });

  test("値を更新すると localStorage に保存されること", () => {
    const { result } = renderHook(() => useLocalStorage(TEST_KEY, INITIAL_VALUE));
    const NEW_VALUE = { foo: "baz" };

    act(() => {
      result.current[1](NEW_VALUE);
    });

    expect(result.current[0]).toEqual(NEW_VALUE);
    expect(JSON.parse(window.localStorage.getItem(TEST_KEY)!)).toEqual(NEW_VALUE);
  });

  test("getStoredData で localStorage のデータを取得できること", () => {
    const EXISTING_VALUE = { hello: "world" };
    window.localStorage.setItem(TEST_KEY, JSON.stringify(EXISTING_VALUE));

    const { result } = renderHook(() => useLocalStorage(TEST_KEY, INITIAL_VALUE));
    
    const storedData = result.current[2]();
    expect(storedData).toEqual(EXISTING_VALUE);
  });
});
