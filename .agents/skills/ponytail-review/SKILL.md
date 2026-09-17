---
name: ponytail-review
description: >
  Code review focused exclusively on hunting and deleting over-engineering.
  Finds what to delete: reinvented standard library, unneeded dependencies,
  speculative abstractions, dead flexibility, and code bloat. Use when
  asked to "review for over-engineering", "what can we delete", "simplify code",
  "clean up bloat", or when invoking /ponytail-review.
---

# Ponytail Review — Hunt & Delete Over-Engineering

Review code diffs and files exclusively for unnecessary complexity and bloat.
One line per finding: location, what to cut, what replaces it.

## Findings Format
`<file>:L<line>: <tag> <what to cut>. <replacement>.`

## Tags
- `delete:` Dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` Hand-rolled logic that standard JavaScript / Node.js ships natively.
- `native:` Third-party dependency or bulky component doing what native browser / CSS already does.
- `yagni:` Abstractions with one implementation, unused configs, excessive boilerplate.
- `shrink:` Same logic in fewer, cleaner lines.
