# Frontend NPM Audit Design

## Goal

Clean the frontend npm dependency tree so `npm audit` reports zero vulnerabilities while keeping the application behavior stable. This work is limited to the `frontend/` project repository.

## Current State

- The frontend uses npm with `package.json` and `package-lock.json`.
- `npm audit` currently reports 11 vulnerabilities: 2 low, 5 moderate, and 4 high.
- The direct audit blocker is `next@16.1.0`; npm recommends `next@16.2.9` as a non-major fix.
- Additional vulnerable transitive packages include `@babel/core`, `ajv`, `brace-expansion`, `dompurify`, `flatted`, `js-yaml`, `minimatch`, `picomatch`, and `postcss`.
- `frontend/` is its own git repository. Backend dependency updates are out of scope for this cycle.

## Approach

Use a security-first, non-breaking upgrade path.

1. Update direct frontend dependencies only when needed for security or compatibility.
2. Prefer patch and minor releases within the existing major lines.
3. Run `npm audit fix` without `--force` to update safe transitive dependencies.
4. Avoid broad latest-major upgrades unless audit remains blocked and the change is explicitly reviewed.

## Expected Dependency Direction

- Update `next` and `eslint-config-next` together to the compatible fixed release line, currently `16.2.9`.
- Keep React on the React 19 line; patch updates are allowed.
- Keep Tailwind on the Tailwind 4 line; patch/minor updates are allowed.
- Keep TypeScript on the 5.x line unless a future toolchain requirement forces a reviewed change.
- Keep ESLint on the 9.x line unless Next tooling requires otherwise.
- Keep KaTeX on the 0.16.x line unless audit or build compatibility requires a reviewed upgrade.

## Validation

Implementation must pass these checks from `frontend/`:

```bash
npm audit
npm run lint
npm run build
```

If dependency changes affect runtime behavior, run a production smoke test against the built app. Existing Next warnings about raw `<img>` and custom fonts may remain unless they become build blockers.

## Commit Plan

Commit frontend changes inside the `frontend/` git repository only. Stage only files that belong to this dependency-audit task. Commit messages should be concise and must not include generated-by watermark text.

Recommended implementation commit:

```bash
git add package.json package-lock.json
git commit -m "fix frontend npm audit vulnerabilities"
```

## Out Of Scope

- Backend Python dependency upgrades.
- `npm audit fix --force` as a first-line action.
- Major upgrades to TypeScript, ESLint, KaTeX, or other tooling unless required by audit and reviewed.
- UI, route, or API behavior changes.
- Initializing a new git repository.
