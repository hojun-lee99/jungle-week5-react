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
  const digitFive = dom.window.document.querySelector('button[data-value="5"]');
  const digitSix = dom.window.document.querySelector('button[data-value="6"]');
  const digitEight = dom.window.document.querySelector('button[data-value="8"]');
  const digitNine = dom.window.document.querySelector('button[data-value="9"]');
  const digitZero = dom.window.document.querySelector('button[data-value="0"]');
  const plus = dom.window.document.querySelector(
    'button[data-action="operator"][data-value="+"]',
  );
  const minus = dom.window.document.querySelector(
    'button[data-action="operator"][data-value="-"]',
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
  const historyPanel = dom.window.document.querySelector('[data-role="history-panel"]');

  const click = (element) => {
    assert.ok(element);
    element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  };

  const readHistory = () =>
    [...dom.window.document.querySelectorAll('[data-role="history-entry"]')].map(
      (item) => item.textContent ?? '',
    );

  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
  assert.equal(historyPanel?.textContent?.includes('최근 5개 계산'), true);
  assert.equal(
    dom.window.document.querySelector('[data-role="history-empty"]')?.textContent,
    '아직 계산 내역이 없습니다.',
  );
  assert.deepEqual(readHistory(), []);

  click(digitOne);
  click(digitTwo);
  click(plus);
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, '12 + 12');
  assert.equal(dom.window.document.title, 'Calculator: 12');
  assert.deepEqual(readHistory(), []);

  click(digitSeven);
  assert.equal(display?.textContent, '7');
  assert.equal(expression?.textContent, '12 + 7');
  assert.equal(dom.window.document.title, 'Calculator: 7');

  click(equal);
  assert.equal(display?.textContent, '19');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 19');
  assert.deepEqual(readHistory(), ['12 + 7 = 19']);

  click(digitThree);
  assert.equal(display?.textContent, '3');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 3');

  click(multiply);
  assert.equal(expression?.textContent, '3 * 3');
  assert.deepEqual(readHistory(), ['12 + 7 = 19']);
  click(digitFour);
  assert.equal(expression?.textContent, '3 * 4');
  click(equal);
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 12');
  assert.deepEqual(readHistory(), ['3 * 4 = 12', '12 + 7 = 19']);

  click(clear);
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
  assert.deepEqual(readHistory(), ['3 * 4 = 12', '12 + 7 = 19']);

  click(digitEight);
  click(divide);
  assert.equal(expression?.textContent, '8 / 8');
  click(digitZero);
  assert.equal(expression?.textContent, '8 / 0');
  click(equal);
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
  assert.deepEqual(readHistory(), [
    '8 / 0 = 0',
    '3 * 4 = 12',
    '12 + 7 = 19',
  ]);

  click(digitNine);
  click(minus);
  click(digitFive);
  click(equal);
  assert.deepEqual(readHistory(), [
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
    '12 + 7 = 19',
  ]);

  click(digitSix);
  click(plus);
  click(digitOne);
  click(equal);
  assert.deepEqual(readHistory(), [
    '6 + 1 = 7',
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
    '12 + 7 = 19',
  ]);

  click(digitTwo);
  click(multiply);
  click(digitThree);
  click(equal);
  assert.equal(display?.textContent, '6');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 6');
  assert.deepEqual(readHistory(), [
    '2 * 3 = 6',
    '6 + 1 = 7',
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
  ]);

  click(root);
  assert.equal(display?.textContent, '6');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 6');
  assert.deepEqual(readHistory(), [
    '2 * 3 = 6',
    '6 + 1 = 7',
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
  ]);
});
