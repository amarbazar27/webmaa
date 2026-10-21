---
name: gravitas
description: >-
  Verification-first reliability runtime and policy enforcement protocol inspired by udaysharmadev/Gravitas.
  Enforces Claude-level coding rigor: mandatory whole-context inspection before editing, root-cause
  resolution over superficial caller patching, deterministic evidence verification, zero premature task completion,
  and anti-hallucination guardrails.
argument-hint: "<task or review target>"
---

# 🛡️ Gravitas: Verification-First Reliability Runtime

Inspired by `udaysharmadev/Gravitas` ("Make Gemini code like Claude Models").
Gravitas eliminates the most common failure modes of AI coding agents: premature task completion, hallucinated fixes, superficial caller patching, and broken build outputs.

## Core Mandates

### 1. Mandatory Pre-Inspection Before Mutation
- **Never guess or edit blind**: Always inspect the full surrounding function, state management lifecycle, and imported utilities before changing a single line of code.
- **Trace the Root Cause**: If an error occurs in a component or route, locate the shared root cause rather than patching superficial symptom checks across multiple callers.

### 2. Multi-Perspective Adversarial Self-Check
Before finalizing any change, run an internal adversarial evaluation against:
1. **Database & Data Protection**: Does this touch Firestore, SQL, or local storage? Is there ANY risk of data deletion or wiping? (Strictly forbidden).
2. **Platform Boundaries**: Is this React 19 / Next.js 16 compatible? Does it break Android 15 Flutter WebView bridges?
3. **Ponytail Anti-Bloat**: Did we write standard library / native platform code, or did we introduce unnecessary npm packages?
4. **Alibaba Security**: Zero `var`, strict equality `===`, zero unsanitized `innerHTML`, verified error boundaries.

### 3. Concrete Evidence Verification (Definition of Done)
An AI agent running under Gravitas is strictly forbidden from claiming a task is "done" until concrete proof is collected:
- Production build succeeds without errors (`npm run build`).
- Zero syntax or lint regressions.
- Git diff strictly matches the scope of the request with zero unintended modifications.
- Automatic deployment pipeline triggered cleanly (`npm run deploy`).
