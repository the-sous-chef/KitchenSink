# Wireframe: ai-chat

**Feature**: `005-ai-integration` | **Date**: 2026-05-09
**Key FRs**: FR-015, FR-016

---

```
+--------------------------------------------------------------------------------+
| AI Recipe Assistant                                                            |
| [Provider: OpenAI ▼]   [Manage Keys]                                           |
+--------------------------------------------------------------------------------+
| Prompt                                                                          |
| [ "Low-carb Italian dinner for 4 with chicken and lemon"                ]      |
|                                                                                |
| Constraints                                                                    |
| [x] Low Carb   [x] Gluten Free   Cuisine [Italian ▼]   Calories [<= 700]      |
|                                                                                |
| [Generate Recipe]                                                              |
+--------------------------------------------------------------------------------+
| Recent prompts                                                                  |
| - Vegetarian lunch under 30 min                                                 |
| - High protein meal prep for 3 days                                             |
+--------------------------------------------------------------------------------+
```

**Interaction notes**:

- If no provider key exists, `Generate Recipe` opens setup flow first.
- Prompt and constraints are preserved when setup completes.
