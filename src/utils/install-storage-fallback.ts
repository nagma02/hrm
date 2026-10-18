// Side-effect module: imported first in main.tsx so the fallback is in place before
// any store reads Web Storage while its module is being evaluated.
import { installStorageFallback } from './storage'

installStorageFallback()
