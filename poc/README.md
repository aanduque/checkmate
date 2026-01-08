# Check Mate - Proof of Concept

This folder contains the original POC implementation of Check Mate.

## Purpose

The `index.html` file serves as the **reference implementation** for the MVP refactor. It is a fully functional Alpine.js monolith containing:

- Complete UI/UX design (daisyUI components, layout, modals)
- All business logic and features
- LocalStorage persistence
- The exact behavior the MVP must replicate

## Usage for LLMs

When working on the MVP refactor, use this file to:

1. **Extract UI patterns** - Copy daisyUI class names, component structures, and layouts
2. **Understand business rules** - Reference the Alpine.js logic for exact behavior
3. **Verify feature parity** - Ensure MVP implements all POC functionality
4. **Match styling** - Replicate the exact look and feel

## Important

- **DO NOT MODIFY** this file - it is a read-only reference
- The MVP in `packages/` should achieve feature parity with this POC
- See `IMPLEMENTATION_PLAN.md` for the gap analysis between POC and current MVP state
