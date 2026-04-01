import { FunctionComponent } from './runtime.js';
import { createElementNode } from './vdom/element-node.js';
import type { VNode } from './vdom/node.js';
import { createTextNode } from './vdom/text-node.js';

const APP_ROOT_ID = 'app';

type CalcButtonProps = {
  label: string;
  action: string;
  value?: string;
  className?: string;
};

const BUTTON_LAYOUT: CalcButtonProps[] = [
  { label: 'AC', action: 'clear', className: 'calc-button calc-button-muted' },
  { label: '+/-', action: 'toggle-sign', className: 'calc-button calc-button-muted' },
  { label: '%', action: 'percent', className: 'calc-button calc-button-muted' },
  { label: '/', action: 'operator', value: '/', className: 'calc-button calc-button-operator' },
  { label: '7', action: 'digit', value: '7' },
  { label: '8', action: 'digit', value: '8' },
  { label: '9', action: 'digit', value: '9' },
  { label: '*', action: 'operator', value: '*', className: 'calc-button calc-button-operator' },
  { label: '4', action: 'digit', value: '4' },
  { label: '5', action: 'digit', value: '5' },
  { label: '6', action: 'digit', value: '6' },
  { label: '-', action: 'operator', value: '-', className: 'calc-button calc-button-operator' },
  { label: '1', action: 'digit', value: '1' },
  { label: '2', action: 'digit', value: '2' },
  { label: '3', action: 'digit', value: '3' },
  { label: '+', action: 'operator', value: '+', className: 'calc-button calc-button-operator' },
  { label: '0', action: 'digit', value: '0', className: 'calc-button calc-button-wide' },
  { label: '.', action: 'dot', value: '.' },
  { label: '=', action: 'equal', className: 'calc-button calc-button-operator' },
];

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setupDemo();
  }, { once: true });
}

// 브라우저에서 #app 루트를 찾고, App을 감싼 FunctionComponent를 최초 마운트한다.
// 지금 단계에서는 정적인 계산기 셸을 한 번 렌더링하는 진입점 역할만 담당한다.
function setupDemo(): void {
  const root = document.getElementById(APP_ROOT_ID);

  if (root === null) {
    return;
  }

  const app = new FunctionComponent(App, root);

  app.mount();
}

// 루트 컴포넌트로서 계산기 전체 화면 구조를 만든다.
// 아직 state는 없기 때문에 Display와 ButtonGrid에 정적인 props만 전달한다.
function App(): VNode {
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
                children: [createTextNode('Static Calculator Shell')],
              }),
              createElementNode('p', {
                props: { class: 'description' },
                children: [
                  createTextNode(
                    'FunctionComponent가 정적 계산기 VDOM을 마운트하는 첫 단계입니다.',
                  ),
                ],
              }),
            ],
          }),
          Display({
            expression: 'Ready',
            display: '0',
          }),
          ButtonGrid({ buttons: BUTTON_LAYOUT }),
        ],
      }),
    ],
  });
}

// 계산기 상단의 화면 영역을 만든다.
// expression은 보조 문구, display는 큰 숫자 표시 영역에 그대로 렌더링된다.
function Display(props: { expression: string; display: string }): VNode {
  return createElementNode('section', {
    props: { class: 'display-panel' },
    children: [
      createElementNode('p', {
        props: { class: 'display-expression' },
        children: [createTextNode(props.expression)],
      }),
      createElementNode('p', {
        props: { class: 'display-value' },
        children: [createTextNode(props.display)],
      }),
    ],
  });
}

// 버튼 목록 데이터를 순회해 계산기 버튼 그리드를 만든다.
// 각 버튼은 실제 DOM button이 아니라 VNode로 변환되어 반환된다.
function ButtonGrid(props: { buttons: CalcButtonProps[] }): VNode {
  return createElementNode('section', {
    props: { class: 'button-grid' },
    children: props.buttons.map((button) => CalcButton(button)),
  });
}

// 버튼 한 개를 계산기용 VNode로 만든다.
// 다음 단계의 클릭 처리에서 사용할 수 있도록 data-action, data-value 속성도 미리 넣어 둔다.
function CalcButton(props: CalcButtonProps): VNode {
  return createElementNode('button', {
    props: {
      type: 'button',
      class: props.className ?? 'calc-button',
      'data-action': props.action,
      'data-value': props.value ?? '',
    },
    children: [createTextNode(props.label)],
  });
}
