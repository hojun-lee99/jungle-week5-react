import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

test('appendDigitToDisplay는 0을 대체하고 이후 숫자를 이어붙인다', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');

  Object.assign(globalThis, {
    document: dom.window.document,
    Element: dom.window.Element,
    Node: dom.window.Node,
    Text: dom.window.Text,
  });

  const { appendDigitToDisplay } = await import('../dist/demo.js');

  assert.equal(appendDigitToDisplay('0', '7'), '7');
  assert.equal(appendDigitToDisplay('12', '3'), '123');
});

test('setupDemo는 숫자 버튼 클릭에 따라 display를 갱신한다', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>');

  Object.assign(globalThis, {
    document: dom.window.document,
    Element: dom.window.Element,
    Node: dom.window.Node,
    Text: dom.window.Text,
  });

  const { setupDemo } = await import('../dist/demo.js');

  setupDemo();

  const display = dom.window.document.querySelector('[data-role="display"]');
  const digitSeven = dom.window.document.querySelector('button[data-value="7"]');
  const digitThree = dom.window.document.querySelector('button[data-value="3"]');
  const digitZero = dom.window.document.querySelector('button[data-value="0"]');
  const root = dom.window.document.getElementById('app');

  assert.equal(display?.textContent, '0');

  digitSeven?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '7');

  digitThree?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '73');

  digitZero?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '730');

  root?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '730');
});
