import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import {
  FunctionComponent,
  createElementNode,
  createTextNode,
} from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

Object.assign(globalThis, {
  document: dom.window.document,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Text: dom.window.Text,
});

test('FunctionComponent.mount는 초기 VDOM을 container에 렌더링한다', () => {
  const container = dom.window.document.createElement('div');
  const component = new FunctionComponent(
    () =>
      createElementNode('section', {
        props: { class: 'calculator-shell' },
        children: [createTextNode('0')],
      }),
    container,
  );

  component.mount();

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild?.nodeName.toLowerCase(), 'section');
  assert.equal(container.firstChild?.textContent, '0');
});

test('FunctionComponent.update는 외부 값 변경 후 diff와 patch로 DOM을 갱신한다', () => {
  const container = dom.window.document.createElement('div');
  let display = '0';
  const component = new FunctionComponent(
    () =>
      createElementNode('section', {
        props: { class: 'calculator-shell' },
        children: [createTextNode(display)],
      }),
    container,
  );

  component.mount();
  display = '42';
  component.update();

  assert.equal(container.firstChild?.textContent, '42');
});

test('텍스트만 바뀌면 루트 DOM node identity를 유지한다', () => {
  const container = dom.window.document.createElement('div');
  let display = '0';
  const component = new FunctionComponent(
    () =>
      createElementNode('section', {
        props: { class: 'calculator-shell' },
        children: [createTextNode(display)],
      }),
    container,
  );

  component.mount();

  const rootNode = container.firstChild;

  display = '7';
  component.update();

  assert.equal(container.firstChild, rootNode);
  assert.equal(container.firstChild?.textContent, '7');
});

test('FunctionComponent.update를 mount 전에 호출하면 초기 렌더처럼 동작한다', () => {
  const container = dom.window.document.createElement('div');
  const component = new FunctionComponent(
    () =>
      createElementNode('section', {
        children: [createTextNode('boot')],
      }),
    container,
  );

  component.update();

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild?.textContent, 'boot');
});
