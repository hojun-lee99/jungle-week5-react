import { useEffect, useMemo, useState } from './runtime.js';
import { createElementNode } from './vdom/element-node.js';
import type { VNode } from './vdom/node.js';
import { createTextNode } from './vdom/text-node.js';

export type Operator = '+' | '-' | '*' | '/' | null;

export type CalculatorState = {
  display: string;
  storedValue: number | null;
  operator: Operator;
  waitingForNextValue: boolean;
};

export type ButtonSpec = {
  label: string;
  action: 'digit' | 'operator' | 'equal' | 'clear';
  value: string;
  className?: string;
};

export type HistoryEntry = {
  expression: string;
  result: string;
};

type PersistedCalculatorSnapshot = {
  display: string;
  history: HistoryEntry[];
};

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  display: '0',
  storedValue: null,
  operator: null,
  waitingForNextValue: false,
};

const CALCULATOR_STORAGE_KEY = 'mini-react:calculator';
const MAX_HISTORY_ENTRIES = 5;

export const BUTTON_LAYOUT: ButtonSpec[] = [
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
let latestHistory: HistoryEntry[] = [];
let latestSetHistory: ((nextHistory: HistoryEntry[]) => void) | null = null;

function createDefaultPersistedCalculatorSnapshot(): PersistedCalculatorSnapshot {
  return {
    display: INITIAL_CALCULATOR_STATE.display,
    history: [],
  };
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.expression === 'string' && typeof entry.result === 'string'
  );
}

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  return globalThis.localStorage;
}

function readPersistedCalculatorSnapshot(): PersistedCalculatorSnapshot {
  const storage = getStorage();

  if (storage === null) {
    return createDefaultPersistedCalculatorSnapshot();
  }

  try {
    const rawValue = storage.getItem(CALCULATOR_STORAGE_KEY);

    if (rawValue === null) {
      return createDefaultPersistedCalculatorSnapshot();
    }

    const parsedValue = JSON.parse(rawValue) as {
      display?: unknown;
      history?: unknown;
    };

    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      typeof parsedValue.display !== 'string' ||
      !Array.isArray(parsedValue.history) ||
      !parsedValue.history.every(isHistoryEntry)
    ) {
      return createDefaultPersistedCalculatorSnapshot();
    }

    return {
      display: parsedValue.display,
      history: parsedValue.history.slice(-MAX_HISTORY_ENTRIES),
    };
  } catch {
    return createDefaultPersistedCalculatorSnapshot();
  }
}

function writePersistedCalculatorSnapshot(
  display: string,
  history: HistoryEntry[],
): void {
  const storage = getStorage();

  if (storage === null) {
    return;
  }

  try {
    storage.setItem(
      CALCULATOR_STORAGE_KEY,
      JSON.stringify({
        display,
        history: history.slice(-MAX_HISTORY_ENTRIES),
      } satisfies PersistedCalculatorSnapshot),
    );
  } catch {
    // localStorage 접근 실패는 UI를 막지 않도록 무시한다.
  }
}

function createRestoredCalculatorState(display: string): CalculatorState {
  return {
    ...INITIAL_CALCULATOR_STATE,
    display,
    waitingForNextValue: display !== INITIAL_CALCULATOR_STATE.display,
  };
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

function canRecordHistory(state: CalculatorState): boolean {
  return state.storedValue !== null && state.operator !== null;
}

function createHistoryEntry(
  state: CalculatorState,
  result: string,
): HistoryEntry {
  return {
    expression: getExpression(state),
    result,
  };
}

function formatHistoryEntry(entry: HistoryEntry): string {
  return `${entry.expression} = ${entry.result}`;
}

export function handleCalculatorClick(event: Event): void {
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
    const nextState = applyEqualToState(latestState);
    const nextHistoryEntry = canRecordHistory(latestState)
      ? createHistoryEntry(latestState, nextState.display)
      : null;

    latestSetState(nextState);

    if (nextHistoryEntry !== null && latestSetHistory !== null) {
      latestSetHistory([...latestHistory, nextHistoryEntry]);
    }

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

export function App(): VNode {
  const persistedSnapshot = useMemo(
    () => readPersistedCalculatorSnapshot(),
    [],
  );
  const [state, setState] = useState<CalculatorState>(
    createRestoredCalculatorState(persistedSnapshot.display),
  );
  const [history, setHistory] = useState<HistoryEntry[]>(
    persistedSnapshot.history,
  );
  const expression = getExpression(state);
  const display = state.display;
  const buttons = BUTTON_LAYOUT;
  const recentHistory = useMemo(
    () => history.slice(-MAX_HISTORY_ENTRIES).reverse(),
    [history],
  );

  useEffect(() => {
    document.title = `Calculator: ${state.display}`;
  }, [state.display]);

  useEffect(() => {
    writePersistedCalculatorSnapshot(state.display, history);
  }, [history, state.display]);

  latestState = state;
  latestSetState = setState;
  latestHistory = history;
  latestSetHistory = setHistory;

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
          Display({ expression, display }),
          ButtonGrid({ buttons }),
          HistoryList({ entries: recentHistory }),
        ],
      }),
    ],
  });
}

export function Display(props: { expression: string; display: string }): VNode {
  return createElementNode('section', {
    props: { class: 'display-panel' },
    children: [
      createElementNode('p', {
        props: { class: 'display-expression', 'data-role': 'expression' },
        children: [createTextNode(props.expression)],
      }),
      createElementNode('p', {
        props: { class: 'display-value', 'data-role': 'display' },
        children: [createTextNode(props.display)],
      }),
    ],
  });
}

export function ButtonGrid(props: { buttons: ButtonSpec[] }): VNode {
  return createElementNode('section', {
    props: { class: 'calculator-grid' },
    children: props.buttons.map((button) => CalcButton(button)),
  });
}

export function HistoryList(props: { entries: HistoryEntry[] }): VNode {
  const content =
    props.entries.length === 0
      ? createElementNode('p', {
          props: { class: 'history-empty', 'data-role': 'history-empty' },
          children: [createTextNode('아직 계산 내역이 없습니다.')],
        })
      : createElementNode('ol', {
          props: { class: 'history-list', 'data-role': 'history-list' },
          children: props.entries.map((entry) =>
            createElementNode('li', {
              props: { class: 'history-item', 'data-role': 'history-entry' },
              children: [createTextNode(formatHistoryEntry(entry))],
            }),
          ),
        });

  return createElementNode('section', {
    props: { class: 'history-panel', 'data-role': 'history-panel' },
    children: [
      createElementNode('h2', {
        props: { class: 'history-title' },
        children: [createTextNode('최근 5개 계산')],
      }),
      content,
    ],
  });
}

export function CalcButton(props: ButtonSpec): VNode {
  return createElementNode('button', {
    props: {
      type: 'button',
      class: props.className ?? 'calc-button',
      'data-action': props.action,
      'data-value': props.value,
    },
    children: [createTextNode(props.label)],
  });
}

export function isOperator(value: string): value is Exclude<Operator, null> {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

export function getExpression(state: CalculatorState): string {
  if (state.storedValue === null || state.operator === null) {
    return 'Ready';
  }

  return `${state.storedValue} ${state.operator} ${state.display}`;
}
