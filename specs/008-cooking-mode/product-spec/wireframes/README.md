# Wireframes: Cooking Mode

**Branch**: `008-cooking-mode`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [product-spec.md](../product-spec.md), [spec.md](../../spec.md)

---

## Index

| File                                                     | Description                                                                                     | Key FRs                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [cook-step.md](./cook-step.md)                           | Primary cook-step screen with large instruction text, progress context, and navigation controls | FR-032, FR-033                           |
| [cook-timer.md](./cook-timer.md)                         | Multi-timer panel and timer completion banner behaviors                                         | FR-034                                   |
| [cook-ingredients-panel.md](./cook-ingredients-panel.md) | Collapsible ingredient checkoff panel during cooking flow                                       | FR-032 (candidate scope warning)         |
| [cook-voice-control.md](./cook-voice-control.md)         | Voice command activation and listening state panel                                              | FR-033, FR-034 (candidate scope warning) |
| [cook-completed.md](./cook-completed.md)                 | End-of-flow completion screen with summary actions                                              | FR-033, FR-035                           |

---

## FR Reference Key

- **FR-032**: Cooking Mode one-step-at-a-time large readable instructions
- **FR-033**: Forward/backward navigation through steps
- **FR-034**: Integrated countdown timers for timed steps
- **FR-035**: Keep device screen active while cooking mode is engaged

---

## Scope Warning Key

- **Candidate scope warning** means the screen documents requested domain behavior (ingredient checkoff / voice-control depth) that is not currently declared as explicit canonical FR in `spec.md`.
