import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isElementNode,
  isTextNode,
} from '../dist/index.js';
import {
  appendDigitToDisplay,
  applyOperatorToState,
  applyDigitToState,
  calculateBinaryResult,
  applyEqualToState,
  applyClearToState,
  Display,
  ButtonGrid,
  CalcButton,
} from '../dist/calculator.js';

test('appendDigitToDisplay는 0을 대체하고 이후 숫자를 이어붙인다', () => {
  assert.equal(appendDigitToDisplay('0', '7'), '7');
  assert.equal(appendDigitToDisplay('12', '3'), '123');
});

test('applyOperatorToState는 현재 display를 저장하고 다음 입력을 기다린다', () => {
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

test('applyOperatorToState는 다음 입력 대기 중이면 연산자만 교체한다', () => {
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

test('applyDigitToState는 다음 입력 대기 상태에서 display를 새 숫자로 교체한다', () => {
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

test('calculateBinaryResult는 사칙연산 결과를 문자열로 반환한다', () => {
  assert.equal(calculateBinaryResult(12, '+', 7), '19');
  assert.equal(calculateBinaryResult(12, '-', 7), '5');
  assert.equal(calculateBinaryResult(12, '*', 7), '84');
  assert.equal(calculateBinaryResult(12, '/', 3), '4');
  assert.equal(calculateBinaryResult(12, '/', 0), '0');
});

test('applyEqualToState는 저장된 연산을 계산하고 결과 상태로 정리한다', () => {
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

test('applyClearToState는 전체 상태를 초기화한다', () => {
  assert.deepEqual(applyClearToState(), {
    display: '0',
    storedValue: null,
    operator: null,
    waitingForNextValue: false,
  });
});

test('Display는 expression과 display를 표시하는 VNode를 만든다', () => {
  const vnode = Display({
    expression: '12 +',
    display: '7',
  });

  assert.equal(isElementNode(vnode), true);
  assert.equal(vnode.tag, 'section');
  assert.equal(vnode.props.class, 'display-panel');
  assert.equal(vnode.children.length, 2);

  const expression = vnode.children[0];
  const display = vnode.children[1];

  assert.equal(isElementNode(expression), true);
  assert.equal(expression.props['data-role'], 'expression');
  assert.equal(isTextNode(expression.children[0]), true);
  assert.equal(expression.children[0].value, '12 +');

  assert.equal(isElementNode(display), true);
  assert.equal(display.props['data-role'], 'display');
  assert.equal(isTextNode(display.children[0]), true);
  assert.equal(display.children[0].value, '7');
});

test('CalcButton는 버튼 속성과 라벨을 가진 VNode를 만든다', () => {
  const vnode = CalcButton({
    label: '+',
    action: 'operator',
    value: '+',
    className: 'calc-button calc-button-operator',
  });

  assert.equal(isElementNode(vnode), true);
  assert.equal(vnode.tag, 'button');
  assert.equal(vnode.props.type, 'button');
  assert.equal(vnode.props.class, 'calc-button calc-button-operator');
  assert.equal(vnode.props['data-action'], 'operator');
  assert.equal(vnode.props['data-value'], '+');
  assert.equal(isTextNode(vnode.children[0]), true);
  assert.equal(vnode.children[0].value, '+');
});

test('ButtonGrid는 버튼 배열 순서대로 자식 버튼 VNode를 만든다', () => {
  const vnode = ButtonGrid({
    buttons: [
      { label: '1', action: 'digit', value: '1' },
      { label: '+', action: 'operator', value: '+', className: 'calc-button calc-button-operator' },
    ],
  });

  assert.equal(isElementNode(vnode), true);
  assert.equal(vnode.tag, 'section');
  assert.equal(vnode.props.class, 'calculator-grid');
  assert.equal(vnode.children.length, 2);

  const firstButton = vnode.children[0];
  const secondButton = vnode.children[1];

  assert.equal(isElementNode(firstButton), true);
  assert.equal(firstButton.props['data-value'], '1');
  assert.equal(isTextNode(firstButton.children[0]), true);
  assert.equal(firstButton.children[0].value, '1');

  assert.equal(isElementNode(secondButton), true);
  assert.equal(secondButton.props['data-value'], '+');
  assert.equal(secondButton.props.class, 'calc-button calc-button-operator');
  assert.equal(isTextNode(secondButton.children[0]), true);
  assert.equal(secondButton.children[0].value, '+');
});
