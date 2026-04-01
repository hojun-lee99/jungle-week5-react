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

test('applyOperatorToState는 현재 display를 저장하고 다음 입력을 기다린다', async () => {
  const { applyOperatorToState } = await import('../dist/demo.js');

  assert.deepEqual(
    applyOperatorToState(
      {
        display: '12',
        storedValue: null,
        operator: null,
        waitingForNextValue: false,
      },
      '+',
    ),
    {
      display: '12',
      storedValue: 12,
      operator: '+',
      waitingForNextValue: true,
    },
  );
});

test('applyOperatorToState는 다음 입력 대기 중이면 연산자만 교체한다', async () => {
  const { applyOperatorToState } = await import('../dist/demo.js');

  assert.deepEqual(
    applyOperatorToState(
      {
        display: '12',
        storedValue: 12,
        operator: '+',
        waitingForNextValue: true,
      },
      '*',
    ),
    {
      display: '12',
      storedValue: 12,
      operator: '*',
      waitingForNextValue: true,
    },
  );
});

test('applyDigitToState는 다음 입력 대기 상태에서 display를 새 숫자로 교체한다', async () => {
  const { applyDigitToState } = await import('../dist/demo.js');

  assert.deepEqual(
    applyDigitToState(
      {
        display: '12',
        storedValue: 12,
        operator: '+',
        waitingForNextValue: true,
      },
      '7',
    ),
    {
      display: '7',
      storedValue: 12,
      operator: '+',
      waitingForNextValue: false,
    },
  );
});

test('calculateBinaryResult는 사칙연산 결과를 문자열로 반환한다', async () => {
  const { calculateBinaryResult } = await import('../dist/demo.js');

  assert.equal(calculateBinaryResult(12, '+', 7), '19');
  assert.equal(calculateBinaryResult(12, '-', 7), '5');
  assert.equal(calculateBinaryResult(12, '*', 7), '84');
  assert.equal(calculateBinaryResult(12, '/', 3), '4');
  assert.equal(calculateBinaryResult(12, '/', 0), '0');
});

test('applyEqualToState는 저장된 연산을 계산하고 결과 상태로 정리한다', async () => {
  const { applyEqualToState } = await import('../dist/demo.js');

  assert.deepEqual(
    applyEqualToState({
      display: '7',
      storedValue: 12,
      operator: '+',
      waitingForNextValue: false,
    }),
    {
      display: '19',
      storedValue: null,
      operator: null,
      waitingForNextValue: true,
    },
  );
});

test('applyClearToState는 전체 상태를 초기화한다', async () => {
  const { applyClearToState } = await import('../dist/demo.js');

  assert.deepEqual(applyClearToState(), {
    display: '0',
    storedValue: null,
    operator: null,
    waitingForNextValue: false,
  });
});

test('setupDemo는 숫자 입력, 계산 결과, 초기화를 화면에 반영한다', async () => {
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

  digitOne?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  digitTwo?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  plus?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, '12 +');

  digitSeven?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '7');
  assert.equal(expression?.textContent, '12 +');

  equal?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '19');
  assert.equal(expression?.textContent, 'Ready');

  digitThree?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '3');
  assert.equal(expression?.textContent, 'Ready');

  multiply?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  digitFour?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  equal?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '12');
  assert.equal(expression?.textContent, 'Ready');

  clear?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');

  digitEight?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  divide?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  digitZero?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  equal?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');

  root?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(display?.textContent, '0');
  assert.equal(expression?.textContent, 'Ready');
});
