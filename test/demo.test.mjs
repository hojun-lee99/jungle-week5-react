import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

test('setupDemo는 숫자 입력, 계산 결과, 초기화와 document.title 갱신을 반영한다', async () => {
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
  const expression = dom.window.document.querySelector('[data-role="expression"]');
  const digitOne = dom.window.document.querySelector('button[data-value="1"]');
  const digitTwo = dom.window.document.querySelector('button[data-value="2"]');
  const digitSeven = dom.window.document.querySelector('button[data-value="7"]');
  const digitThree = dom.window.document.querySelector('button[data-value="3"]');
  const digitFour = dom.window.document.querySelector('button[data-value="4"]');
  const digitEight = dom.window.document.querySelector('button[data-value="8"]');
  const digitZero = dom.window.document.querySelector('button[data-value="0"]');
  const plus = dom.window.document.querySelector(
    'button[data-action="operator"][data-value="+"]',
  );
  const multiply = dom.window.document.querySelector(
    'button[data-action="operator"][data-value="*"]',
  );
  const divide = dom.window.document.querySelector(
    'button[data-action="operator"][data-value="/"]',
  );
  const equal = dom.window.document.querySelector(
    'button[data-action="equal"][data-value="="]',
  );
  const clear = dom.window.document.querySelector(
    'button[data-action="clear"][data-value="AC"]',
  );
  const root = dom.window.document.getElementById('app');

  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');

  digitOne?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  digitTwo?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  plus?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, '12 + 12');
  assert.equal(dom.window.document.title, 'Calculator: 12');

  digitSeven?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '7');
  assert.equal(expression?.textContent, '12 + 7');
  assert.equal(dom.window.document.title, 'Calculator: 7');

  equal?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '19');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 19');

  digitThree?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '3');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 3');

  multiply?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(expression?.textContent, '3 * 3');
  digitFour?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(expression?.textContent, '3 * 4');
  equal?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 12');

  clear?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');

  digitEight?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  divide?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(expression?.textContent, '8 / 8');
  digitZero?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(expression?.textContent, '8 / 0');
  equal?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');

  root?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
});
