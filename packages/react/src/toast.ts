/**
 * toast(): a short message in the page's <chu-toaster> (one is added to <body> if there is none).
 *
 *   import { toast } from "@jaatster/blip-react";
 *   <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Save</Button>
 *   const saving = toast("Saving…");  …  saving.close();
 *
 * It returns the same handle as @jaatster/blip-elements' toast(), at once: `close()` works straight away (a toast closed
 * before it shows never shows) and `closed` settles once it has gone. The toaster element loads as soon as this
 * module runs in the browser, so toasts show at once; one asked for in the first moments of a page shows as soon as
 * it has loaded. Call it from an event handler or an effect, never while rendering or on the server. Put a <Toaster>
 * in your layout to choose where toasts come up.
 */
import type { ToastHandle, ToastOptions } from "@jaatster/blip-elements/toast";

export type { ToastHandle, ToastOptions, ToastTone } from "@jaatster/blip-elements/toast";

type Toasts = typeof import("@jaatster/blip-elements/toast");
let ready: Toasts | undefined;
let loading: Promise<Toasts> | undefined;
const load = (): Promise<Toasts> => (loading ??= import("@jaatster/blip-elements/toast").then((m) => (ready = m)));
// In the browser, start loading the toaster now, so the first toast needs no wait.
if (typeof document !== "undefined") load().catch(() => undefined);

/** Shows a toast. A string is just a title. Returns its handle: `close()` and `closed`. */
export function toast(options: ToastOptions | string): ToastHandle {
  if (ready) return ready.toast(options);
  // Still loading: a handle now, the toast as soon as the toaster is here.
  let shown: ToastHandle | undefined;
  let cancelled = false;
  let done!: () => void;
  const closed = new Promise<void>((resolve) => (done = resolve));
  load()
    .then((m) => {
      if (cancelled) return done();
      shown = m.toast(options);
      void shown.closed.then(done);
    })
    .catch((error: unknown) => {
      console.error("Blip: could not show the toast.", error);
      done();
    });
  return {
    close: () => {
      if (shown) shown.close();
      else cancelled = true;
    },
    closed,
  };
}
