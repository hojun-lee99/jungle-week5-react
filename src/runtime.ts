import { applyPatches, mountVNode } from './vdom/dom.js';
import { diffVNode } from './vdom/diff.js';
import type { VNode } from './vdom/node.js';

// 루트 컴포넌트는 props 없이 현재 화면에 해당하는 VNode 하나를 반환한다.
export type RootRenderFn = () => VNode;

// Hook 구현 단계에서 "지금 어떤 컴포넌트가 렌더 중인지" 알아야 하므로
// 현재 실행 중인 FunctionComponent를 전역 참조로 잠시 들고 있는다.
let currentComponent: FunctionComponent | null = null;

type EffectCallback = () => void;

export class FunctionComponent {
  // 이후 useState, useMemo, useEffect가 값을 저장할 공용 hook 슬롯 배열이다.
  hooks: unknown[] = [];
  // 이번 렌더에서 현재 몇 번째 hook을 읽는 중인지 추적하는 인덱스다.
  hookIndex = 0;
  // 직전 렌더에서 만든 VDOM을 기억해 update 시 diff의 기준으로 사용한다.
  private prevVNode: VNode | null = null;
  private readonly container: Element;
  private readonly renderFn: RootRenderFn;
  // 이번 렌더에서 실행 대상으로 등록된 effect를 DOM 반영 뒤에 한 번에 실행한다.
  private pendingEffects: EffectCallback[] = [];

  constructor(renderFn: RootRenderFn, container: Element) {
    this.renderFn = renderFn;
    this.container = container;
  }

  // hookIndex와 currentComponent를 매 렌더 시작 시점에 맞춰 초기화한 뒤
  // renderFn을 실행해 다음 VDOM을 만든다.
  private renderVNode(): VNode {
    this.hookIndex = 0;
    // 매 렌더마다 effect 실행 대기열을 새로 모은다.
    this.pendingEffects = [];
    currentComponent = this;

    try {
      return this.renderFn();
    } finally {
      currentComponent = null;
    }
  }

  // 최초 렌더링을 수행한다.
  // renderFn으로 VDOM을 만든 뒤 기존 mountVNode를 이용해 실제 DOM에 한 번 그린다.
  mount(): void {
    const nextVNode = this.renderVNode();

    mountVNode(this.container, nextVNode);
    this.prevVNode = nextVNode;
    // effect는 화면이 실제 DOM에 반영된 뒤 실행한다.
    this.flushEffects();
  }

  // 상태 변경 이후 재렌더링을 수행한다.
  // 이전 VDOM과 새 VDOM을 비교해 patch를 만들고, 바뀐 부분만 실제 DOM에 반영한다.
  update(): void {
    // 아직 mount되지 않은 상태라면 update도 최초 렌더처럼 처리한다.
    if (this.prevVNode === null) {
      this.mount();
      return;
    }

    const nextVNode = this.renderVNode();
    const patches = diffVNode(this.prevVNode, nextVNode);

    applyPatches(this.container, patches);
    this.prevVNode = nextVNode;
    // update에서도 patch 적용이 끝난 뒤 effect를 실행한다.
    this.flushEffects();
  }

  queueEffect(effect: EffectCallback): void {
    this.pendingEffects.push(effect);
  }

  // effects에 담긴 작업들 실행
  private flushEffects(): void {
    const effects = this.pendingEffects;
    this.pendingEffects = [];
    // effect를 꺼내서 콜백함수 실행
    for (const effect of effects) {
      effect();
    }
  }
}

// 다음 단계 Hook 구현에서 현재 렌더 중인 루트 컴포넌트를 읽기 위한 접근 함수다.
export function getCurrentFunctionComponent(): FunctionComponent | null {
  return currentComponent;
}

// hook 호출 순서에 따라 현재 컴포넌트의 다음 슬롯 번호를 하나 소비한다.
// 렌더 밖에서는 Hook을 쓸 수 없으므로 명확한 에러를 던진다.
export function consumeHookSlot(): {
  component: FunctionComponent;
  index: number;
} {
  const component = getCurrentFunctionComponent();

  if (component === null) {
    throw new Error(
      'Hooks can only be used while rendering the root FunctionComponent.',
    );
  }

  const index = component.hookIndex;
  component.hookIndex += 1;

  return {
    component,
    index,
  };
}

type StateHook<T> = {
  value: T;
  setState: (nextState: T) => void;
};

type MemoHook<T> = {
  value: T;
  deps?: readonly unknown[];
};

type EffectHook = {
  // 이전 렌더의 dependency를 저장해 다음 렌더에서 재실행 여부를 판단한다.
  deps?: readonly unknown[];
};

function areHookDepsEqual(
  prevDeps: readonly unknown[] | undefined,
  nextDeps: readonly unknown[] | undefined,
): boolean {
  // deps를 생략한 effect는 매 렌더 실행해야 하므로 같다고 보지 않는다.
  if (prevDeps === undefined || nextDeps === undefined) {
    return false;
  }

  if (prevDeps.length !== nextDeps.length) {
    return false;
  }

  for (let index = 0; index < prevDeps.length; index += 1) {
    if (!Object.is(prevDeps[index], nextDeps[index])) {
      return false;
    }
  }

  return true;
}

// 가장 단순한 형태의 useState다.
// 슬롯이 비어 있으면 초기 상태와 고정 setter를 만들고, 이후 렌더에서는 같은 슬롯을 재사용한다.
export function useState<T>(initialState: T): [T, (nextState: T) => void] {
  const { component, index } = consumeHookSlot();
  let hook = component.hooks[index] as StateHook<T> | undefined;

  if (hook === undefined) {
    hook = {
      value: initialState,
      setState: (nextState: T) => {
        const currentHook = component.hooks[index] as StateHook<T> | undefined;

        if (currentHook === undefined) {
          throw new Error(`Missing state hook at index ${index}.`);
        }

        currentHook.value = nextState;
        component.update();
      },
    };

    component.hooks[index] = hook;
  }

  return [hook.value, hook.setState];
}

export function useMemo<T>(
  factory: () => T,
  deps?: readonly unknown[],
): T {
  const { component, index } = consumeHookSlot();
  const hook = component.hooks[index] as MemoHook<T> | undefined;
  const nextDeps = deps === undefined ? undefined : [...deps];

  if (
    hook === undefined ||
    deps === undefined ||
    !areHookDepsEqual(hook.deps, nextDeps)
  ) {
    const value = factory();

    component.hooks[index] = {
      value,
      deps: nextDeps,
    };

    return value;
  }

  return hook.value;
}

// 매개변수로 콜백 함수랑 deps 전달
export function useEffect(effect: () => void, deps?: readonly unknown[]): void {
  const { component, index } = consumeHookSlot();
  const hook = component.hooks[index] as EffectHook | undefined;
  // 전달받은 deps 배열은 복사해 보관해 외부 변경 영향을 막는다.
  const nextDeps = deps === undefined ? undefined : [...deps];
  const shouldRun =
    hook === undefined ||
    deps === undefined ||
    !areHookDepsEqual(hook.deps, nextDeps);

  if (hook === undefined) {
    component.hooks[index] = {
      deps: nextDeps,
    } satisfies EffectHook;
  } else {
    hook.deps = nextDeps;
  }

  if (shouldRun) {
    // 렌더 중에는 바로 실행하지 않고 commit 이후 실행 큐에 넣는다.
    component.queueEffect(effect);
  }
}
