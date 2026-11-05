// Styles for the injected UI. They live inside a shadow root, so the recipe
// site's CSS can't reach them and they can't leak onto the page.
export const css = `
:host { all: initial; }
* { box-sizing: border-box; }
.wrap {
  position: fixed; right: 20px; bottom: 20px; z-index: 2147483647;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #1C1917; font-size: 14px; line-height: 1.45;
  display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
}
.pill {
  display: inline-flex; align-items: center; gap: 10px; cursor: pointer;
  background: #1C1917; color: #FBF7F0; border: 0; border-radius: 999px;
  padding: 8px 16px 8px 8px; font: 600 14px/1 Inter, ui-sans-serif, system-ui, sans-serif;
  box-shadow: 0 12px 32px -12px rgba(28,25,23,.55);
  transition: transform .15s ease, box-shadow .15s ease;
}
.pill:hover { transform: translateY(-1px); box-shadow: 0 16px 36px -12px rgba(28,25,23,.6); }
.pill:focus-visible, .close:focus-visible, .cta:focus-visible { outline: 3px solid #E9A23B; outline-offset: 2px; }
.pill svg { width: 28px; height: 28px; flex: none; }
.count { background: #E9A23B; color: #1C1917; border-radius: 999px; padding: 3px 8px; font-size: 12px; }
.panel {
  width: min(380px, calc(100vw - 40px)); max-height: min(640px, calc(100vh - 110px)); overflow: auto;
  background: #FFFDF9; border: 1px solid #E7DFD2; border-radius: 20px;
  box-shadow: 0 30px 70px -25px rgba(28,25,23,.45);
}
.head {
  position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: #FBF7F0; border-bottom: 1px solid #E7DFD2;
}
.brand { display: flex; align-items: center; gap: 8px; font: 600 16px Georgia, "Times New Roman", serif; }
.brand svg { width: 26px; height: 26px; }
.brand em { color: #B86E12; }
.close {
  width: 30px; height: 30px; border-radius: 999px; border: 1px solid #E7DFD2; background: #FFFDF9;
  cursor: pointer; font-size: 18px; line-height: 1; color: #57534E;
}
.body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
h2 { margin: 0; font: 600 21px/1.2 Georgia, "Times New Roman", serif; }
h3 { margin: 0 0 8px; font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: #57534E; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.stat { border: 1px solid #E7DFD2; border-radius: 12px; padding: 8px 10px; background: #FBF7F0; }
.stat b { display: block; font: 600 20px Georgia, serif; }
.stat span { font-size: 12px; color: #57534E; }
ol, ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.ing { border: 1px solid #E7DFD2; border-radius: 12px; padding: 8px 10px; }
.ing-top { display: flex; justify-content: space-between; gap: 8px; font-weight: 600; }
.ing-top span { font-weight: 500; color: #57534E; white-space: nowrap; font-size: 12px; }
.bar { height: 5px; border-radius: 99px; background: #F3ECE0; margin: 6px 0; overflow: hidden; }
.bar i { display: block; height: 100%; background: #E9A23B; border-radius: 99px; }
.swaps { font-size: 12px; color: #713F12; }
.chips { flex-direction: row; flex-wrap: wrap; gap: 6px; }
.chip { background: #F0FDF4; border: 1px solid #86EFAC; color: #14532D; border-radius: 999px; padding: 3px 10px; font-size: 12px; }
.cta {
  display: block; text-align: center; text-decoration: none; background: #1C1917; color: #FBF7F0;
  font-weight: 600; border-radius: 12px; padding: 11px 14px;
}
.cta:hover { background: #292524; }
.note { margin: 0; font-size: 12px; color: #57534E; }
.flat { margin: 0; }
.retry { border: 0; cursor: pointer; width: 100%; font: inherit; font-weight: 600; }
.center { text-align: center; padding: 18px 8px; }
.spin {
  width: 34px; height: 34px; margin: 0 auto 12px; border-radius: 999px;
  border: 4px solid #1C1917; border-top-color: transparent; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spin { animation-duration: 3s; } .pill { transition: none; } }
`;
