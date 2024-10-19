export function isEnv(env: 'browser' | 'node'): boolean {
  if (env === 'browser' && typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return true;
  } else if (env === 'node' && typeof process !== 'undefined' && process.versions && process.versions.node) {
    return true;
  }
  return false;
}

export const detectedNetwork = () => isEnv('node') && process.env.NETWORK ? process.env.NETWORK : 'datil';
