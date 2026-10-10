## 2026-10-07 - Avoid Object.values(Object.getOwnPropertyDescriptors()) and Spread in Hot Paths
**Learning:** In hot JSON traversal and diff routines (like `isJsonValue` and `diffObject`), calling `Object.values(Object.getOwnPropertyDescriptors(obj))` allocates full property descriptor dictionaries and value arrays per object, while `[...a, ...b]` allocates intermediate spread arrays.
**Action:** Reuse existing `Reflect.ownKeys` results with on-demand `Object.getOwnPropertyDescriptor` lookups and short-circuit `some()` checks across separate key lists to eliminate GC allocation pressure.
