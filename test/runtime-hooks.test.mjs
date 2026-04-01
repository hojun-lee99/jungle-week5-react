import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import {
  FunctionComponent,
  consumeHookSlot,
  getCurrentFunctionComponent,
} from '../dist/runtime.js';
import { createElementNode, createTextNode } from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

Object.assign(globalThis, {
  document: dom.window.document,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Text: dom.window.Text,
});

test('consumeHookSlot은 렌더 중에 같은 호출 순서대로 슬롯을 배정한다', () => {
  const container = dom.window.document.createElement('div');
  const snapshots = [];

  const component = new FunctionComponent(() => {
    snapshots.push({
      currentComponent: getCurrentFunctionComponent(),
      firstSlot: consumeHookSlot(),
      secondSlot: consumeHookSlot(),
      thirdSlot: consumeHookSlot(),
    });

    return createElementNode('section', {
      children: [createTextNode('hooks')],
    });
  }, container);

  component.mount();

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].currentComponent, component);
  assert.equal(snapshots[0].firstSlot.component, component);
  assert.equal(snapshots[0].firstSlot.index, 0);
  assert.equal(snapshots[0].secondSlot.index, 1);
  assert.equal(snapshots[0].thirdSlot.index, 2);
  assert.equal(component.hookIndex, 3);
  assert.equal(getCurrentFunctionComponent(), null);
});

test('update가 새 렌더를 시작하면 hookIndex는 다시 0부터 시작한다', () => {
  const container = dom.window.document.createElement('div');
  const indicesPerRender = [];
  let renderCount = 0;

  const component = new FunctionComponent(() => {
    renderCount += 1;

    const firstSlot = consumeHookSlot();
    const secondSlot = consumeHookSlot();

    indicesPerRender.push([firstSlot.index, secondSlot.index]);

    if (renderCount === 1) {
      firstSlot.component.hooks[firstSlot.index] = 'persisted-display';
      secondSlot.component.hooks[secondSlot.index] = 'persisted-operator';
    }

    return createElementNode('section', {
      children: [createTextNode(String(renderCount))],
    });
  }, container);

  component.mount();
  component.update();

  assert.deepEqual(indicesPerRender, [
    [0, 1],
    [0, 1],
  ]);
  assert.equal(component.hooks[0], 'persisted-display');
  assert.equal(component.hooks[1], 'persisted-operator');
  assert.equal(getCurrentFunctionComponent(), null);
});

test('consumeHookSlot을 렌더 밖에서 호출하면 명확한 에러를 던진다', () => {
  assert.throws(
    () => consumeHookSlot(),
    /Hooks can only be used while rendering the root FunctionComponent\./,
  );
});

test('renderFn이 예외를 던져도 currentComponent는 정리된다', () => {
  const container = dom.window.document.createElement('div');
  const component = new FunctionComponent(() => {
    consumeHookSlot();
    throw new Error('render failed');
  }, container);

  assert.throws(() => component.mount(), /render failed/);
  assert.equal(getCurrentFunctionComponent(), null);
});
