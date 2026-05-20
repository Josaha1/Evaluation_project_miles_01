import '../css/app.css'

import { createInertiaApp } from '@inertiajs/react'

import { createRoot } from 'react-dom/client'
import { route as routeFn } from 'ziggy-js'

// ประกาศ type สำหรับ Vite
// declare global {
//   interface ImportMeta {
//     env: {
//       [key: string]: string | boolean | undefined
//       VITE_APP_NAME?: string
//     }
//     glob: (path: string) => Record<string, () => Promise<unknown>>
//   }
// }
declare global{
  const route : typeof routeFn
}
const appName = import.meta.env.VITE_APP_NAME || 'Laventory'

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => {
    const pages = import.meta.glob('./pages/**/*.tsx');
    const page = pages[`./pages/${name}.tsx`];
    if (!page) throw new Error(`Page not found: ${name}`);
    return page();
  },
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(<App {...props} />)
  },
  progress: {
    color: '#4B5563',
    showSpinner: true,
  },
})