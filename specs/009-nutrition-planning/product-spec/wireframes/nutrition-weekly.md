# Wireframe: Nutrition Weekly View

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**FRs**: `FR-037`, `SC-010`

---

## ASCII Wireframe

```
+--------------------------------------------------------------+
| Weekly Nutrition Compliance                                   |
+--------------------------------------------------------------+
| Week: Jun 08 - Jun 14                    [Prev] [Next]       |
|                                                              |
| Day   Cal   Protein   Carbs   Fat   Status                   |
| Mon   95%   92%       101%    89%   [Moderate]               |
| Tue   96%   91%       107%    85%   [Moderate]               |
| Wed   103%  100%      98%     102%  [On Track]               |
| Thu   87%   80%       96%     82%   [Under]                  |
| Fri   110%  99%       120%    90%   [Over]                   |
| Sat   101%  104%      99%     100%  [On Track]               |
| Sun   98%   95%       100%    97%   [On Track]               |
|                                                              |
| 7-Day Summary: 4 On Track | 2 Moderate | 1 Under/Over        |
| Biggest Gap: Protein on Thu (-20%)                           |
| [Open Day Details] [Adjust Weekly Goal]                      |
+--------------------------------------------------------------+
```

---

## Interaction Notes

- Weekly surface emphasizes consistency and trend diagnosis.
- Day rows deep-link into meal-breakdown details.
- Accuracy expectations inherit from `SC-010`.
