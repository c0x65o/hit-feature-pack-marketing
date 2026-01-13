// @hit/feature-pack-marketing
// A HIT feature pack

// Pages - exported individually for tree-shaking
export { Dashboard } from './pages/Dashboard';
export { EntityList } from './pages/EntityList';
export { EntityDetail } from './pages/EntityDetail';
export { EntityEdit } from './pages/EntityEdit';

// Schema exports MOVED to @hit/feature-pack-marketing/schema to avoid bundling drizzle-orm in client
