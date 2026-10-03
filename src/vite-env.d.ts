/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_BUILD_TIME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Module declarations for non-TS files
declare module '*.json' {
  const value: any
  export default value
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.svg' {
  import type { ReactElement } from 'react'
  export const ReactComponent: ReactElement
  export default string
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}