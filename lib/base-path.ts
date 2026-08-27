/**
 * "/<repo-name>" when built for GitHub Pages, "" everywhere else. next/link
 * prefixes automatically, but plain hrefs, window.open, next/image srcs, and
 * <link> stylesheets need it spelled out.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
