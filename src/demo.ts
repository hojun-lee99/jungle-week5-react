import { FunctionComponent, useState } from './runtime.js';
import { createElementNode } from './vdom/element-node.js';
import type { VNode } from './vdom/node.js';
import { createTextNode } from './vdom/text-node.js';

const APP_ROOT_ID = 'app';
const DIGIT_BUTTONS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'] as const;

let latestDisplay = '0';
let latestSetDisplay: ((nextDisplay: string) => void) | null = null;
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

  const button = target.closest('button[data-action="digit"]');

  if (button === null || latestSetDisplay === null) {
    return;
  }

  const digit = button.getAttribute('data-value') ?? '';

  if (digit === '') {
    return;
  }

  latestSetDisplay(appendDigitToDisplay(latestDisplay, digit));
}

function App(): VNode {
  const [display, setDisplay] = useState('0');

  latestDisplay = display;
  latestSetDisplay = setDisplay;

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
                children: [createTextNode('Digit Input Demo')],
              }),
              createElementNode('p', {
                props: { class: 'description' },
                children: [
                  createTextNode(
                    '숫자 버튼 클릭으로 state와 화면이 함께 바뀌는 단계를 확인합니다.',
                  ),
                ],
              }),
            ],
          }),
          createElementNode('section', {
            props: { class: 'display-panel' },
            children: [
              createElementNode('p', {
                props: { class: 'display-expression' },
                children: [createTextNode('App only + useState')],
              }),
              createElementNode('p', {
                props: { class: 'display-value', 'data-role': 'display' },
                children: [createTextNode(display)],
              }),
            ],
          }),
          createElementNode('section', {
            props: { class: 'digit-grid' },
            children: DIGIT_BUTTONS.map((digit) =>
              createElementNode('button', {
                props: {
                  type: 'button',
                  class: digit === '0' ? 'calc-button digit-button-zero' : 'calc-button',
                  'data-action': 'digit',
                  'data-value': digit,
                },
                children: [createTextNode(digit)],
              }),
            ),
          }),
        ],
      }),
    ],
  });
}
