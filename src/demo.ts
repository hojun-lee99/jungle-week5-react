import { FunctionComponent } from './runtime.js';
import { App, handleCalculatorClick } from './calculator.js';

const APP_ROOT_ID = 'app';
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

export function setupDemo(): void {
  const root = document.getElementById(APP_ROOT_ID);

  if (root === null || mountedRoots.has(root)) {
    return;
  }

  root.addEventListener('click', handleCalculatorClick);
  mountedRoots.add(root);

  const app = new FunctionComponent(App, root);

  app.mount();
}
