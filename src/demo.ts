import { FunctionComponent, useState } from './runtime.js';
import { createElementNode } from './vdom/element-node.js';
import type { VNode } from './vdom/node.js';
import { createTextNode } from './vdom/text-node.js';

const APP_ROOT_ID = 'app';
type Operator = '+' | '-' | '*' | '/' | null;

type CalculatorState = {
  display: string;
  storedValue: number | null;
  operator: Operator;
  waitingForNextValue: boolean;
};

type ButtonSpec = {
  label: string;
  action: 'digit' | 'operator' | 'equal' | 'clear';
  value: string;
  className?: string;
};

const INITIAL_CALCULATOR_STATE: CalculatorState = {
  display: '0',
  storedValue: null,
  operator: null,
  waitingForNextValue: false,
};

const BUTTON_LAYOUT: ButtonSpec[] = [
  { label: 'AC', action: 'clear', value: 'AC', className: 'calc-button calc-button-muted' },
  { label: '7', action: 'digit', value: '7' },
  { label: '8', action: 'digit', value: '8' },
  { label: '9', action: 'digit', value: '9' },
  { label: '/', action: 'operator', value: '/', className: 'calc-button calc-button-operator' },
  { label: '4', action: 'digit', value: '4' },
  { label: '5', action: 'digit', value: '5' },
  { label: '6', action: 'digit', value: '6' },
  { label: '*', action: 'operator', value: '*', className: 'calc-button calc-button-operator' },
  { label: '1', action: 'digit', value: '1' },
  { label: '2', action: 'digit', value: '2' },
  { label: '3', action: 'digit', value: '3' },
  { label: '-', action: 'operator', value: '-', className: 'calc-button calc-button-operator' },
  {
    label: '0',
    action: 'digit',
    value: '0',
    className: 'calc-button calculator-button-zero',
  },
  { label: '=', action: 'equal', value: '=', className: 'calc-button calc-button-operator' },
  { label: '+', action: 'operator', value: '+', className: 'calc-button calc-button-operator' },
];

let latestState: CalculatorState = INITIAL_CALCULATOR_STATE;
let latestSetState: ((nextState: CalculatorState) => void) | null = null;
const mountedRoots = new WeakSet<Element>();

if (typeof document !== 'undefined') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      setupDemo();
    },
    { once: true },
  );
}

export function appendDigitToDisplay(display: string, digit: string): string {
  if (display === '0') {
    return digit;
  }

  return `${display}${digit}`;
}

export function applyDigitToState(
  state: CalculatorState,
  digit: string,
): CalculatorState {
  if (state.waitingForNextValue) {
    return {
      ...state,
      display: digit,
      waitingForNextValue: false,
    };
  }

  return {
    ...state,
    display: appendDigitToDisplay(state.display, digit),
    waitingForNextValue: false,
  };
}

export function applyOperatorToState(
  state: CalculatorState,
  operator: Exclude<Operator, null>,
): CalculatorState {
  if (state.storedValue !== null && state.waitingForNextValue) {
    return {
      ...state,
      operator,
      waitingForNextValue: true,
    };
  }

  return {
    ...state,
    storedValue: Number(state.display),
    operator,
    waitingForNextValue: true,
  };
}

export function calculateBinaryResult(
  left: number,
  operator: Exclude<Operator, null>,
  right: number,
): string {
  switch (operator) {
    case '+':
      return String(left + right);
    case '-':
      return String(left - right);
    case '*':
      return String(left * right);
    case '/':
      return right === 0 ? '0' : String(left / right);
  }
}

export function applyEqualToState(state: CalculatorState): CalculatorState {
  if (state.storedValue === null || state.operator === null) {
    return state;
  }

  return {
    display: calculateBinaryResult(
      state.storedValue,
      state.operator,
      Number(state.display),
    ),
    storedValue: null,
    operator: null,
    waitingForNextValue: true,
  };
}

export function applyClearToState(): CalculatorState {
  return INITIAL_CALCULATOR_STATE;
}

export function setupDemo(): void {
  const root = document.getElementById(APP_ROOT_ID);

  if (root === null || mountedRoots.has(root)) {
    return;
  }

  root.addEventListener('click', handleRootClick);
  mountedRoots.add(root);

  const app = new FunctionComponent(App, root);

  app.mount();
}

function handleRootClick(event: Event): void {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest('button[data-action]');

  if (button === null || latestSetState === null) {
    return;
  }

  const action = button.getAttribute('data-action');
  const value = button.getAttribute('data-value') ?? '';

  if (action === 'clear') {
    latestSetState(applyClearToState());
    return;
  }

  if (action === 'equal') {
    latestSetState(applyEqualToState(latestState));
    return;
  }

  if (value === '') {
    return;
  }

  if (action === 'digit') {
    latestSetState(applyDigitToState(latestState, value));
    return;
  }

  if (action === 'operator' && isOperator(value)) {
    latestSetState(applyOperatorToState(latestState, value));
  }
}

function App(): VNode {
  const [state, setState] = useState<CalculatorState>(INITIAL_CALCULATOR_STATE);

  latestState = state;
  latestSetState = setState;

  return createElementNode('main', {
    props: { class: 'calculator-app' },
    children: [
      createElementNode('section', {
        props: { class: 'calculator-card' },
        children: [
          createElementNode('header', {
            props: { class: 'calculator-header' },
            children: [
              createElementNode('p', {
                props: { class: 'eyebrow' },
                children: [createTextNode('Week 5 Mini React')],
              }),
              createElementNode('h1', {
                props: { class: 'title' },
                children: [createTextNode('Calculator Result Demo')],
              }),
              createElementNode('p', {
                props: { class: 'description' },
                children: [
                  createTextNode(
                    '사칙연산 결과와 AC 초기화까지 동작하는 단계를 확인합니다.',
                  ),
                ],
              }),
            ],
          }),
          createElementNode('section', {
            props: { class: 'display-panel' },
            children: [
              createElementNode('p', {
                props: { class: 'display-expression', 'data-role': 'expression' },
                children: [createTextNode(getExpression(state))],
              }),
              createElementNode('p', {
                props: { class: 'display-value', 'data-role': 'display' },
                children: [createTextNode(state.display)],
              }),
            ],
          }),
          createElementNode('section', {
            props: { class: 'calculator-grid' },
            children: BUTTON_LAYOUT.map((button) =>
              createElementNode('button', {
                props: {
                  type: 'button',
                  class: button.className ?? 'calc-button',
                  'data-action': button.action,
                  'data-value': button.value,
                },
                children: [createTextNode(button.label)],
              }),
            ),
          }),
        ],
      }),
    ],
  });
}

function isOperator(value: string): value is Exclude<Operator, null> {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

function getExpression(state: CalculatorState): string {
  if (state.storedValue === null || state.operator === null) {
    return 'Ready';
  }

  return `${state.storedValue} ${state.operator}`;
}
