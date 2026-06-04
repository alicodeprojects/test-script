// "Remote" code — fetched at runtime and executed in the sandbox against the
// async `dom` proxy. It never touches the real DOM directly; every call is an
// awaited message routed to the content script, which performs the real
// operation. Swap this file's URL for an actual CDN later — the pipeline is
// identical.

console.log("[remote] running against autorefresh.io");

// Rewrite the heading (read its text first, then replace) — proves an async
// read you branch on, plus a write derived from it.
const h1 = await dom.query("h1");
if (h1) {
  const original = await dom.get(h1, "textContent");
  console.log("[remote] original heading:", original);
  await dom.set(h1, "textContent", "⚠️ This site was modified by remote code");
}

// Inject an unmissable "hacked" modal with a working close button. Built via
// the generic bridge: insertAdjacentHTML for the markup, then dom.on to wire a
// real click listener (no inline onclick — that would be CSP-blocked).
const body = await dom.query("body");
await dom.call(body, "insertAdjacentHTML", [
  "beforeend",
  `
  <div id="rme-hacked-overlay" style="position:fixed;inset:0;z-index:2147483647;
       display:flex;align-items:center;justify-content:center;
       background:rgba(0,0,0,.6);font-family:system-ui,sans-serif">
    <div style="position:relative;max-width:420px;margin:16px;padding:32px 28px;
         border-radius:14px;background:#dc2626;color:#fff;text-align:center;
         box-shadow:0 20px 60px rgba(0,0,0,.5)">
      <button id="rme-hacked-close" aria-label="Close" style="position:absolute;
           top:10px;right:12px;width:28px;height:28px;border:0;border-radius:50%;
           background:rgba(255,255,255,.2);color:#fff;font-size:18px;line-height:1;
           cursor:pointer">×</button>
      <div style="font-size:44px;line-height:1;margin-bottom:12px">🛑</div>
      <h2 style="margin:0 0 8px;font-size:22px">Your website has been hacked</h2>
      <p style="margin:0;opacity:.9;font-size:14px">
        Injected by remotely-fetched code running in a sandbox. Click × to close.
      </p>
    </div>
  </div>`,
]);

// Wire the close button: remove the overlay when clicked.
const closeButton = await dom.query("#rme-hacked-close");
if (closeButton) {
  await dom.on(closeButton, "click", async () => {
    const overlay = await dom.query("#rme-hacked-overlay");
    if (overlay) await dom.call(overlay, "remove");
    console.log("[remote] modal closed");
  });
}

console.log("[remote] done");
