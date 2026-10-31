/**
 * toast(): a short message in the page's <pp-toaster> (one is added to <body> if there is none).
 *
 *   import { toast } from "@jaatster/blip-react";
 *   <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Save</Button>
 *   const t = await toast("Copied");  t.close();
 *
 * It loads the toaster element the first time it is called, so call it from an event handler or an effect, never
 * while rendering or on the server. Put a <Toaster> in your layout to choose where toasts come up.
 */
import type { ToastHandle, ToastOptions } from "@jaatster/blip-elements/toast";

export type { ToastHandle, ToastOptions, ToastTone } from "@jaatster/blip-elements/toast";

/** Shows a toast. A string is just a title. Resolves to its handle: `close()`, `closed`, `el`. */
export async function toast(options: ToastOptions | string): Promise<ToastHandle> {
  const { toast: show } = await import("@jaatster/blip-elements/toast");
  return show(options);
}
