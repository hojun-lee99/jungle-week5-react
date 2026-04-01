import test from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';

import {
  FunctionComponent,
  consumeHookSlot,
  getCurrentFunctionComponent,
} from '../dist/runtime.js';
import {
  createElementNode,
  createTextNode,
  useEffect,
  useMemo,
  useState,
} from '../dist/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');

Object.assign(globalThis, {
  document: dom.window.document,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Text: dom.window.Text,
});

test('consumeHookSlot은 렌더 중에 같은 호출 순서대로 슬롯을 배정한다', () => {
  const container = dom.window.document.createElement('div');
  const snapshots = [];

  const component = new FunctionComponent(() => {
    snapshots.push({
      currentComponent: getCurrentFunctionComponent(),
      firstSlot: consumeHookSlot(),
      secondSlot: consumeHookSlot(),
      thirdSlot: consumeHookSlot(),
    });

    return createElementNode('section', {
      children: [createTextNode('hooks')],
    });
  }, container);

  component.mount();

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].currentComponent, component);
  assert.equal(snapshots[0].firstSlot.component, component);
  assert.equal(snapshots[0].firstSlot.index, 0);
  assert.equal(snapshots[0].secondSlot.index, 1);
  assert.equal(snapshots[0].thirdSlot.index, 2);
  assert.equal(component.hookIndex, 3);
  assert.equal(getCurrentFunctionComponent(), null);
});

test('update가 새 렌더를 시작하면 hookIndex는 다시 0부터 시작한다', () => {
  const container = dom.window.document.createElement('div');
  const indicesPerRender = [];
  let renderCount = 0;

  const component = new FunctionComponent(() => {
    renderCount += 1;

    const firstSlot = consumeHookSlot();
    const secondSlot = consumeHookSlot();

    indicesPerRender.push([firstSlot.index, secondSlot.index]);

    if (renderCount === 1) {
      firstSlot.component.hooks[firstSlot.index] = 'persisted-display';
      secondSlot.component.hooks[secondSlot.index] = 'persisted-operator';
    }

    return createElementNode('section', {
      children: [createTextNode(String(renderCount))],
    });
  }, container);

  component.mount();
  component.update();

  assert.deepEqual(indicesPerRender, [
    [0, 1],
    [0, 1],
  ]);
  assert.equal(component.hooks[0], 'persisted-display');
  assert.equal(component.hooks[1], 'persisted-operator');
  assert.equal(getCurrentFunctionComponent(), null);
});

test('consumeHookSlot을 렌더 밖에서 호출하면 명확한 에러를 던진다', () => {
  assert.throws(
    () => consumeHookSlot(),
    /Hooks can only be used while rendering the root FunctionComponent\./,
  );
});

test('renderFn이 예외를 던져도 currentComponent는 정리된다', () => {
  const container = dom.window.document.createElement('div');
  const component = new FunctionComponent(() => {
    consumeHookSlot();
    throw new Error('render failed');
  }, container);

  assert.throws(() => component.mount(), /render failed/);
  assert.equal(getCurrentFunctionComponent(), null);
});

test('useEffect는 mount 직후 effect를 실행해 document.title을 갱신한다', () => {
  document.title = 'before';
  const container = dom.window.document.createElement('div');

  const component = new FunctionComponent(() => {
    const [count] = useState(0);

    useEffect(() => {
      document.title = `Count: ${count}`;
    }, [count]);

    return createElementNode('section', {
      children: [createTextNode(String(count))],
    });
  }, container);

  component.mount();

  assert.equal(document.title, 'Count: 0');
});

test('useEffect는 dependency가 바뀌면 update 뒤 다시 실행된다', () => {
  document.title = 'before';
  const container = dom.window.document.createElement('div');
  let capturedSetCount;

  const component = new FunctionComponent(() => {
    const [count, setCount] = useState(0);
    capturedSetCount = setCount;

    useEffect(() => {
      document.title = `Count: ${count}`;
    }, [count]);

    return createElementNode('section', {
      children: [createTextNode(String(count))],
    });
  }, container);

  component.mount();
  capturedSetCount(7);

  assert.equal(document.title, 'Count: 7');
});

test('useEffect는 dependency가 같으면 다시 실행되지 않는다', () => {
  const container = dom.window.document.createElement('div');
  const effectRuns = [];
  let capturedSetCount;

  const component = new FunctionComponent(() => {
    const [count, setCount] = useState(1);
    capturedSetCount = setCount;

    useEffect(() => {
      effectRuns.push(count);
    }, [count]);

    return createElementNode('section', {
      children: [createTextNode(String(count))],
    });
  }, container);

  component.mount();
  capturedSetCount(1);

  assert.deepEqual(effectRuns, [1]);
});

test('여러 useEffect는 hook 호출 순서대로 실행된다', () => {
  const container = dom.window.document.createElement('div');
  const effectOrder = [];

  const component = new FunctionComponent(() => {
    useEffect(() => {
      effectOrder.push('first');
    }, []);

    useEffect(() => {
      effectOrder.push('second');
    }, []);

    return createElementNode('section', {
      children: [createTextNode('effects')],
    });
  }, container);

  component.mount();

  assert.deepEqual(effectOrder, ['first', 'second']);
});

test('useMemo는 첫 렌더에서 factory를 실행하고 계산값을 반환한다', () => {
  const container = dom.window.document.createElement('div');
  let computeCount = 0;
  const renderedValues = [];

  const component = new FunctionComponent(() => {
    const value = useMemo(() => {
      computeCount += 1;
      return `memo-${computeCount}`;
    }, []);

    renderedValues.push(value);

    return createElementNode('section', {
      children: [createTextNode(value)],
    });
  }, container);

  component.mount();

  assert.equal(computeCount, 1);
  assert.deepEqual(renderedValues, ['memo-1']);
  assert.equal(container.firstChild?.textContent, 'memo-1');
});

test('useMemo는 dependency가 같으면 cached value를 재사용한다', () => {
  const container = dom.window.document.createElement('div');
  let source = 12;
  let computeCount = 0;
  const renderedValues = [];

  const component = new FunctionComponent(() => {
    const value = useMemo(() => {
      computeCount += 1;
      return `${source} + ${source}`;
    }, [source]);

    renderedValues.push(value);

    return createElementNode('section', {
      children: [createTextNode(value)],
    });
  }, container);

  component.mount();
  component.update();

  assert.equal(computeCount, 1);
  assert.deepEqual(renderedValues, ['12 + 12', '12 + 12']);
});

test('useMemo는 dependency가 바뀌면 값을 다시 계산한다', () => {
  const container = dom.window.document.createElement('div');
  let source = 12;
  let computeCount = 0;
  const renderedValues = [];

  const component = new FunctionComponent(() => {
    const value = useMemo(() => {
      computeCount += 1;
      return `${source}`;
    }, [source]);

    renderedValues.push(value);

    return createElementNode('section', {
      children: [createTextNode(value)],
    });
  }, container);

  component.mount();
  source = 19;
  component.update();

  assert.equal(computeCount, 2);
  assert.deepEqual(renderedValues, ['12', '19']);
});

test('useMemo는 deps를 생략하면 매 렌더마다 다시 계산한다', () => {
  const container = dom.window.document.createElement('div');
  let computeCount = 0;
  const renderedValues = [];

  const component = new FunctionComponent(() => {
    const value = useMemo(() => {
      computeCount += 1;
      return `run-${computeCount}`;
    });

    renderedValues.push(value);

    return createElementNode('section', {
      children: [createTextNode(value)],
    });
  }, container);

  component.mount();
  component.update();

  assert.equal(computeCount, 2);
  assert.deepEqual(renderedValues, ['run-1', 'run-2']);
});
