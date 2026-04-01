import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import {
  FunctionComponent,
  createElementNode,
  createTextNode,
  useState,
} from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

Object.assign(globalThis, {
  document: dom.window.document,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Text: dom.window.Text,
});

test('useState는 초기 상태를 반환하고 첫 렌더 결과에 반영한다', () => {
  const container = dom.window.document.createElement('div');
  let renderedCount = -1;

  const component = new FunctionComponent(() => {
    const [count] = useState(0);
    renderedCount = count;

    return createElementNode('section', {
      children: [createTextNode(String(count))],
    });
  }, container);

  component.mount();

  assert.equal(renderedCount, 0);
  assert.equal(container.firstChild?.textContent, '0');
});

test('useState setter는 상태를 갱신하고 재렌더 후에도 같은 참조를 유지한다', () => {
  const container = dom.window.document.createElement('div');
  const renderedCounts = [];
  const setterRefs = [];
  let nextInitialCount = 0;
  let capturedSetter;

  const component = new FunctionComponent(() => {
    const [count, setCount] = useState(nextInitialCount);

    renderedCounts.push(count);
    setterRefs.push(setCount);

    if (capturedSetter === undefined) {
      capturedSetter = setCount;
    }

    return createElementNode('section', {
      children: [createTextNode(String(count))],
    });
  }, container);

  component.mount();

  nextInitialCount = 999;
  capturedSetter(42);

  assert.deepEqual(renderedCounts, [0, 42]);
  assert.equal(container.firstChild?.textContent, '42');
  assert.equal(setterRefs[0], setterRefs[1]);
});

test('useState를 렌더 밖에서 호출하면 명확한 에러를 던진다', () => {
  assert.throws(
    () => useState(0),
    /Hooks can only be used while rendering the root FunctionComponent\./,
  );
});
