import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

const STORAGE_KEY = 'mini-react:calculator';

function assignDomGlobals(dom) {
  Object.assign(globalThis, {
    document: dom.window.document,
    Element: dom.window.Element,
    Node: dom.window.Node,
    Text: dom.window.Text,
    localStorage: dom.window.localStorage,
  });
}

async function setupDemoWithDom(options = {}) {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="app"></div></body></html>',
    { url: 'http://localhost' },
  );

  assignDomGlobals(dom);

  if (options.persistedSnapshot !== undefined) {
    dom.window.localStorage.setItem(STORAGE_KEY, options.persistedSnapshot);
  }

  const { setupDemo } = await import('../dist/demo.js');

  setupDemo();

  return dom;
}

function click(dom, element) {
  assert.ok(element);
  element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
}

function readHistory(dom) {
  return [...dom.window.document.querySelectorAll('[data-role="history-entry"]')].map(
    (item) => item.textContent ?? '',
  );
}

function readPersistedSnapshot(dom) {
  const rawValue = dom.window.localStorage.getItem(STORAGE_KEY);

  assert.notEqual(rawValue, null);

  return JSON.parse(rawValue);
}

test('setupDemo는 저장된 display와 history를 새로고침 후 복원한다', async () => {
  const dom = await setupDemoWithDom({
    persistedSnapshot: JSON.stringify({
      display: '48',
      history: [
        { expression: '1 + 2', result: '3' },
        { expression: '6 * 7', result: '42' },
      ],
    }),
  });

  const display = dom.window.document.querySelector('[data-role="display"]');
  const expression = dom.window.document.querySelector('[data-role="expression"]');

  assert.equal(display?.textContent, '48');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 48');
  assert.deepEqual(readHistory(dom), ['6 * 7 = 42', '1 + 2 = 3']);
});

test('setupDemo는 깨졌거나 잘못된 localStorage 값이 있으면 기본 상태로 시작한다', async () => {
  const brokenDom = await setupDemoWithDom({
    persistedSnapshot: '{broken json',
  });

  assert.equal(
    brokenDom.window.document.querySelector('[data-role="display"]')?.textContent,
    '0',
  );
  assert.equal(brokenDom.window.document.title, 'Calculator: 0');
  assert.deepEqual(readHistory(brokenDom), []);

  const invalidShapeDom = await setupDemoWithDom({
    persistedSnapshot: JSON.stringify({
      display: 12,
      history: 'not-an-array',
    }),
  });

  assert.equal(
    invalidShapeDom.window.document.querySelector('[data-role="display"]')
      ?.textContent,
    '0',
  );
  assert.equal(invalidShapeDom.window.document.title, 'Calculator: 0');
  assert.deepEqual(readHistory(invalidShapeDom), []);
});

test('setupDemo는 저장된 history가 5개를 넘으면 최신 5개만 복원해 최신순으로 렌더링한다', async () => {
  const dom = await setupDemoWithDom({
    persistedSnapshot: JSON.stringify({
      display: '15',
      history: [
        { expression: '1 + 1', result: '2' },
        { expression: '2 + 2', result: '4' },
        { expression: '3 + 3', result: '6' },
        { expression: '4 + 4', result: '8' },
        { expression: '5 + 5', result: '10' },
        { expression: '6 + 6', result: '12' },
      ],
    }),
  });

  assert.deepEqual(readHistory(dom), [
    '6 + 6 = 12',
    '5 + 5 = 10',
    '4 + 4 = 8',
    '3 + 3 = 6',
    '2 + 2 = 4',
  ]);
  assert.deepEqual(readPersistedSnapshot(dom), {
    display: '15',
    history: [
      { expression: '2 + 2', result: '4' },
      { expression: '3 + 3', result: '6' },
      { expression: '4 + 4', result: '8' },
      { expression: '5 + 5', result: '10' },
      { expression: '6 + 6', result: '12' },
    ],
  });
});

test('setupDemo는 숫자 입력, 계산 결과, 초기화와 localStorage 갱신을 반영한다', async () => {
  const dom = await setupDemoWithDom();

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

  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
  assert.equal(historyPanel?.textContent?.includes('최근 5개 계산'), true);
  assert.equal(
    dom.window.document.querySelector('[data-role="history-empty"]')?.textContent,
    '아직 계산 내역이 없습니다.',
  );
  assert.deepEqual(readHistory(dom), []);
  assert.deepEqual(readPersistedSnapshot(dom), {
    display: '0',
    history: [],
  });

  click(dom, digitOne);
  click(dom, digitTwo);
  click(dom, plus);
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, '12 + 12');
  assert.equal(dom.window.document.title, 'Calculator: 12');
  assert.deepEqual(readHistory(dom), []);

  click(dom, digitSeven);
  assert.equal(display?.textContent, '7');
  assert.equal(expression?.textContent, '12 + 7');
  assert.equal(dom.window.document.title, 'Calculator: 7');

  click(dom, equal);
  assert.equal(display?.textContent, '19');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 19');
  assert.deepEqual(readHistory(dom), ['12 + 7 = 19']);
  assert.deepEqual(readPersistedSnapshot(dom), {
    display: '19',
    history: [{ expression: '12 + 7', result: '19' }],
  });

  click(dom, digitThree);
  assert.equal(display?.textContent, '3');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 3');

  click(dom, multiply);
  assert.equal(expression?.textContent, '3 * 3');
  assert.deepEqual(readHistory(dom), ['12 + 7 = 19']);
  click(dom, digitFour);
  assert.equal(expression?.textContent, '3 * 4');
  click(dom, equal);
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 12');
  assert.deepEqual(readHistory(dom), ['3 * 4 = 12', '12 + 7 = 19']);

  click(dom, clear);
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
  assert.deepEqual(readHistory(dom), ['3 * 4 = 12', '12 + 7 = 19']);
  assert.deepEqual(readPersistedSnapshot(dom), {
    display: '0',
    history: [
      { expression: '12 + 7', result: '19' },
      { expression: '3 * 4', result: '12' },
    ],
  });

  click(dom, digitEight);
  click(dom, divide);
  assert.equal(expression?.textContent, '8 / 8');
  click(dom, digitZero);
  assert.equal(expression?.textContent, '8 / 0');
  click(dom, equal);
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 0');
  assert.deepEqual(readHistory(dom), [
    '8 / 0 = 0',
    '3 * 4 = 12',
    '12 + 7 = 19',
  ]);

  click(dom, digitNine);
  click(dom, minus);
  click(dom, digitFive);
  click(dom, equal);
  assert.deepEqual(readHistory(dom), [
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
    '12 + 7 = 19',
  ]);

  click(dom, digitSix);
  click(dom, plus);
  click(dom, digitOne);
  click(dom, equal);
  assert.deepEqual(readHistory(dom), [
    '6 + 1 = 7',
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
    '12 + 7 = 19',
  ]);

  click(dom, digitTwo);
  click(dom, multiply);
  click(dom, digitThree);
  click(dom, equal);
  assert.equal(display?.textContent, '6');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 6');
  assert.deepEqual(readHistory(dom), [
    '2 * 3 = 6',
    '6 + 1 = 7',
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
  ]);
  assert.deepEqual(readPersistedSnapshot(dom), {
    display: '6',
    history: [
      { expression: '3 * 4', result: '12' },
      { expression: '8 / 0', result: '0' },
      { expression: '9 - 5', result: '4' },
      { expression: '6 + 1', result: '7' },
      { expression: '2 * 3', result: '6' },
    ],
  });

  click(dom, root);
  assert.equal(display?.textContent, '6');
  assert.equal(expression?.textContent, 'Ready');
  assert.equal(dom.window.document.title, 'Calculator: 6');
  assert.deepEqual(readHistory(dom), [
    '2 * 3 = 6',
    '6 + 1 = 7',
    '9 - 5 = 4',
    '8 / 0 = 0',
    '3 * 4 = 12',
  ]);
});
