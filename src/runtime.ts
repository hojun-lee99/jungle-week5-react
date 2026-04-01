import { applyPatches, mountVNode } from './vdom/dom.js';
import { diffVNode } from './vdom/diff.js';
import type { VNode } from './vdom/node.js';

// 루트 컴포넌트는 props 없이 현재 화면에 해당하는 VNode 하나를 반환한다.
export type RootRenderFn = () => VNode;

// Hook 구현 단계에서 "지금 어떤 컴포넌트가 렌더 중인지" 알아야 하므로
// 현재 실행 중인 FunctionComponent를 전역 참조로 잠시 들고 있는다.
let currentComponent: FunctionComponent | null = null;

export class FunctionComponent {
  // 이후 useState, useMemo, useEffect가 값을 저장할 공용 hook 슬롯 배열이다.
  hooks: unknown[] = [];
  // 이번 렌더에서 현재 몇 번째 hook을 읽는 중인지 추적하는 인덱스다.
  hookIndex = 0;
  // 직전 렌더에서 만든 VDOM을 기억해 update 시 diff의 기준으로 사용한다.
  private prevVNode: VNode | null = null;
  private readonly container: Element;
  private readonly renderFn: RootRenderFn;

  constructor(renderFn: RootRenderFn, container: Element) {
    this.renderFn = renderFn;
    this.container = container;
  }

  // 최초 렌더링을 수행한다.
  // renderFn으로 VDOM을 만든 뒤 기존 mountVNode를 이용해 실제 DOM에 한 번 그린다.
  mount(): void {
    this.hookIndex = 0;
    currentComponent = this;

    try {
      const nextVNode = this.renderFn();

      mountVNode(this.container, nextVNode);
      this.prevVNode = nextVNode;
    } finally {
      currentComponent = null;
    }
  }

  // 상태 변경 이후 재렌더링을 수행한다.
  // 이전 VDOM과 새 VDOM을 비교해 patch를 만들고, 바뀐 부분만 실제 DOM에 반영한다.
  update(): void {
    // 아직 mount되지 않은 상태라면 update도 최초 렌더처럼 처리한다.
    if (this.prevVNode === null) {
      this.mount();
      return;
    }

    this.hookIndex = 0;
    currentComponent = this;

    try {
      const nextVNode = this.renderFn();
      const patches = diffVNode(this.prevVNode, nextVNode);

      applyPatches(this.container, patches);
      this.prevVNode = nextVNode;
    } finally {
      currentComponent = null;
    }
  }
}

// 다음 단계 Hook 구현에서 현재 렌더 중인 루트 컴포넌트를 읽기 위한 접근 함수다.
export function getCurrentFunctionComponent(): FunctionComponent | null {
  return currentComponent;
}
