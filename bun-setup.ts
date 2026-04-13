import { JSDOM } from "jsdom";

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

const window = dom.window;

// @ts-expect-error - JSDOM window is not perfectly compatible with global window type
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;
global.Node = window.Node;
global.Element = window.Element;
global.HTMLElement = window.HTMLElement;
global.HTMLInputElement = window.HTMLInputElement;
global.HTMLTextAreaElement = window.HTMLTextAreaElement;
global.HTMLSelectElement = window.HTMLSelectElement;
global.Event = window.Event;
global.MouseEvent = window.MouseEvent;
global.KeyboardEvent = window.KeyboardEvent;
global.FocusEvent = window.FocusEvent;
global.PointerEvent = window.PointerEvent;
global.CustomEvent = window.CustomEvent;
global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.crypto = window.crypto as any;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

// アニメーション関連のモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.requestAnimationFrame = (callback) => setTimeout(callback, 0) as any;
global.cancelAnimationFrame = (id) => clearTimeout(id);

// ResizeObserver のモック (FullCalendar などで必要)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
