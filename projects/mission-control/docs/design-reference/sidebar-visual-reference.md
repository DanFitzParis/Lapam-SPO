# Sidebar Component — Visual Properties Reference

> For consumption by external build systems (Next.js + Tailwind).
> All values are computed px / rgba. No CSS variables, no relative units.

---

## 1. Sidebar Container (`<aside>`)

| Property | Expanded | Collapsed (Presentation) |
|---|---|---|
| width | 240px | 72px |
| min-width | 240px | 72px |
| height | 100vh (sticky, top: 0) | 100vh |
| background-color | `rgba(29, 18, 44, 1)` · `#1D122C` | same |
| padding | 0 | 0 |
| display | flex | flex |
| flex-direction | column | column |
| transition | `all 180ms cubic-bezier(0.2, 0, 0, 1)` | same |

---

## 2. Brand Area Container

| Property | Expanded | Collapsed |
|---|---|---|
| padding | 24px 20px 16px 20px | 24px 8px 16px 8px |
| text-align | left | center |

---

## 3. "SPO" Heading

| Property | Expanded | Collapsed |
|---|---|---|
| font-family | Montserrat, sans-serif | same |
| font-size | 24px | 18px |
| font-weight | 700 | 700 |
| line-height | normal (≈29px) | normal (≈22px) |
| color | `rgba(255, 255, 255, 1)` · `#FFFFFF` | same |

---

## 4. "Mission Control" Subtitle

| Property | Value |
|---|---|
| font-family | Montserrat, sans-serif |
| font-size | 14px |
| font-weight | 400 |
| line-height | normal (≈17px) |
| color | `rgba(255, 255, 255, 0.64)` |
| visibility | hidden when collapsed |

---

## 5. Nav Container (`<nav>`)

| Property | Value |
|---|---|
| display | flex |
| flex-direction | column |
| gap | 4px |
| padding | 0 12px |
| margin-top | 8px |
| flex | 1 (fills remaining vertical space) |

---

## 6. Nav Item — Active State

| Property | Expanded | Collapsed |
|---|---|---|
| display | flex | flex |
| align-items | center | center |
| justify-content | flex-start | center |
| gap | 12px | 0 |
| padding | 12px 16px | 12px 8px |
| border-radius | 16px | 16px |
| background-color | `rgba(48, 30, 74, 1)` · `#301E4A` | same |
| color | `rgba(255, 255, 255, 1)` · `#FFFFFF` | same |
| cursor | pointer | pointer |
| transition | `all 180ms cubic-bezier(0.2, 0, 0, 1)` | same |

---

## 7. Nav Item — Inactive State

| Property | Expanded | Collapsed |
|---|---|---|
| display | flex | flex |
| align-items | center | center |
| justify-content | flex-start | center |
| gap | 12px | 0 |
| padding | 12px 16px | 12px 8px |
| border-radius | 16px | 16px |
| background-color | transparent | transparent |
| color | `rgba(255, 255, 255, 0.88)` | same |
| cursor | pointer | pointer |
| transition | `all 180ms cubic-bezier(0.2, 0, 0, 1)` | same |

---

## 8. Nav Item — Hover State

| Property | Value |
|---|---|
| background-color | no explicit hover bg (inherits active/inactive) |
| color | no change on hover |
| Note | Hover is handled by CSS transition on the element; no separate hover background is defined in the current implementation |

---

## 9. Nav Icon

| Property | Value |
|---|---|
| width | 20px |
| height | 20px |
| stroke-width | 2px (Lucide default) |
| color | inherited from parent nav item |
| flex-shrink | 0 |

---

## 10. Nav Label Text

| Property | Value |
|---|---|
| font-family | Montserrat, sans-serif |
| font-size | 14px |
| font-weight | 500 |
| line-height | normal (≈17px) |
| color | inherited from parent nav item |
| visibility | hidden when collapsed |

---

## 11. Footer Area (Bottom Toggles)

| Property | Value |
|---|---|
| padding | 0 12px 24px 12px |
| display | flex |
| flex-direction | column |
| gap | 8px |

### Toggle Button (Presentation / Dark Canvas)

| Property | Expanded | Collapsed |
|---|---|---|
| display | flex | flex |
| align-items | center | center |
| justify-content | flex-start | center |
| gap | 12px | 0 |
| padding | 12px 16px | 12px 8px |
| border-radius | 16px | 16px |
| font-family | Montserrat, sans-serif | same |
| font-size | 14px | 14px |
| font-weight | 500 | 500 |
| color (default) | `rgba(255, 255, 255, 0.88)` | same |
| color (Presentation active) | `rgba(255, 255, 255, 1)` | same |
| background (default) | transparent | transparent |
| background (Presentation active) | `rgba(48, 30, 74, 1)` · `#301E4A` | same |
| icon size | 20×20px | same |

---

## Navigation Items Reference

| Route | Icon (Lucide) | Label |
|---|---|---|
| `/` | `Users` | Team |
| `/projects` | `Kanban` | Projects |
| `/activity` | `Activity` | Live Activity |

## Bottom Toggles Reference

| Action | Icon (Lucide) | Label |
|---|---|---|
| Toggle presentation mode | `Monitor` | Presentation |
| Toggle dark canvas | `Moon` / `Sun` | Dark Canvas / Light Canvas |

---

*Generated from SPO Mission Control · Sidebar.tsx · April 2026*
