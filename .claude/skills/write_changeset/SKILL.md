---
name: write_changeset
description: Create a changeset file documenting package changes for the next release.
user-invocable: true
---

# Write Changeset

Create a changeset file in `.changeset/` that documents what changed and the semver bump type.

## When to Write a Changeset

Every PR requires a changeset file. CI enforces this.

- If the PR modifies source code in `@stripe/bun-toolkit`, write a normal changeset with the package and bump type.
- If the PR only touches tests, dev tooling, CI, build config, or other non-published code, write an **empty changeset** (no package entries in the frontmatter).

## Publishable Packages

| Package name          | Directory |
| --------------------- | --------- |
| `@stripe/bun-toolkit` | `.`       |

## Bump Types

- **patch** - Bug fixes, documentation corrections, internal refactors that don't change the public API
- **minor** - New features, new exports, new optional parameters, non-breaking additions
- **major** - Breaking changes (removed exports, renamed types, changed function signatures). Requires `INTENTIONAL MAJOR` in the PR description to pass CI.

## Procedure

1. Determine whether the changes affect the published package (`@stripe/bun-toolkit`) or only dev/CI/tooling
2. Determine the appropriate bump type
3. Generate a unique changeset filename using a random identifier (lowercase letters and hyphens, e.g., `happy-dogs-dance`)
4. Create the changeset file at `.changeset/<name>.md`

### Changeset File Format

```markdown
---
"@stripe/bun-toolkit": minor
---

Add support for X
```

For a non-published change (CI, tests, tooling):

```markdown
---
---

Fix lint configuration
```

## Examples

### Bug fix in the published package

```markdown
---
"@stripe/bun-toolkit": patch
---

Fix edge case in glob resolution when path contains spaces
```

### New feature in the published package

```markdown
---
"@stripe/bun-toolkit": minor
---

Add watchGlob helper for reactive file watching
```

### CI or tooling change only

```markdown
---
---

Add changeset enforcement to CI
```

## Notes

- Each PR should have at most one changeset file. If you need to revise, edit the existing one rather than creating a second.
- If unsure about bump type, prefer `patch` for fixes and `minor` for new features.
- Major bumps require `INTENTIONAL MAJOR` in the PR description to pass the `no-major-bumps` CI check.
