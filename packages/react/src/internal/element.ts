"use client";
/**
 * The runtime behind every generated element wrapper (src/generated/*.ts). One component per custom element, the
 * same in React 18 and 19:
 *
 * - Attributes are written as attributes, in the first render, so they are there when the element connects (it
 *   reads its settings then) and in server-rendered HTML. Booleans are present ("", or a switch's one value, as
 *   `fullWidth` writes data-width="full") or absent; numbers become text. React 19 would assign a prop as a property
 *   whenever the element has one by that name, which runs a setter before the element is connected (a dialog's
 *   `open` would never open it) or throws on a getter-only one, so on the client a name that is also a property is
 *   written in another case ("Open"): HTML attribute names ignore case, so the browser stores `open`, and React 19
 *   keeps it an attribute. Server HTML keeps the plain name, and hydration matches the two without a warning.
 * - Properties are assigned once the element is defined (an element still waiting for its definition is left
 *   alone, so its class keeps its accessors), and only when the value differs from the element's own: a property
 *   only the element has (DropText's `text`) on the first render and whenever it changes, and a writable property
 *   that mirrors an attribute whenever the prop changes after the first render (the attribute covered the first),
 *   so a change reaches an element that reads the attribute only once (Combobox's `value`). As with attributes, a
 *   prop that does not change is never written again: a choice made in the element stays.
 * - Events: every `on…` prop listens to its blip-* event on the element, through one listener per event that calls
 *   the latest handler. (Like any listener added after the element is in the page, it does not hear an event the
 *   element sends while it first connects.)
 * - The element's module is imported on the client the first time a wrapper mounts, so it upgrades in place; a
 *   page that already defined the element loses nothing. Nothing runs on the server.
 * - The element's own classes (those it adds when it connects, and any its docs require) are rendered from the
 *   start, so the markup is styled before it upgrades and on the server, and React keeps them; `className` adds to
 *   them. It is written as `class` (React 18 would write a "classname" attribute on a custom element).
 * - The ref is the element itself.
 */
import { createElement, forwardRef, useCallback, useEffect, useLayoutEffect, useRef, version } from "react";
import type { ForwardRefExoticComponent, HTMLAttributes, PropsWithoutRef, ReactNode, Ref, RefAttributes } from "react";

/** The props every wrapper takes besides its own: global HTML attributes, minus the ones it redefines. */
export type ElementProps<E extends HTMLElement, Own extends string = never> = Omit<HTMLAttributes<E>, Own | "children"> & {
  children?: ReactNode;
};

export interface ElementSpec {
  /** The tag, e.g. "blip-dialog". */
  tag: string;
  /** The component's display name. */
  name: string;
  /** Host classes: the ones the element adds when it connects, and any the docs require. */
  className?: string;
  /** Imports the module that defines the element. */
  load?: () => Promise<unknown>;
  /**
   * prop -> [attribute, writable property kept in step after the first render, the attribute is also a property name,
   * the value a boolean prop writes when true (a switch such as data-width="full"; "" otherwise)].
   */
  attributes?: Readonly<Record<string, readonly [attribute: string, property?: string, shadowed?: boolean, on?: string]>>;
  /** Props that are only properties. */
  properties?: readonly string[];
  /** prop -> event name. */
  events?: Readonly<Record<string, string>>;
  /** The element draws its own content: children are not rendered. */
  empty?: boolean;
  /** A string child is also the element's `text` property (it reads its text once, then takes the property). */
  textChildren?: boolean;
}

const react19 = Number.parseInt(version, 10) >= 19;
const client = typeof document !== "undefined";
const useClientLayoutEffect = client ? useLayoutEffect : useEffect;

/** An attribute's value as React should write it: booleans present (or a switch's value) or absent, everything else
    as text. */
function serialize(value: unknown, on = ""): string | undefined {
  if (value === undefined || value === null || value === false) return undefined;
  if (value === true) return on;
  return String(value);
}

/**
 * The key React writes an attribute under. On the client, React 19 writes a name that is also a property as a
 * property, so such a name goes in as "Name" (HTML attribute names ignore case). On the server it stays as it is:
 * server HTML reads `open=""`, and hydration compares attribute names without case.
 */
const attributeKey = (name: string, shadowed?: boolean): string => (react19 && client && shadowed ? name[0]!.toUpperCase() + name.slice(1) : name);

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/** A typed React component for one custom element. */
export function createComponent<E extends HTMLElement, P extends object>(spec: ElementSpec): ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>> {
  const attributes = spec.attributes ?? {};
  const properties = new Set(spec.properties ?? []);
  const events = Object.entries(spec.events ?? {});
  const eventProps = new Set(events.map(([prop]) => prop));

  const Component = forwardRef<E, Record<string, unknown>>(function Component(props, forwarded) {
    const node = useRef<E | null>(null);
    const handlers = useRef<Record<string, unknown>>({});
    const mounted = useRef(false);
    const last = useRef(new Map<string, unknown>());
    /** Changes not yet applied (the element is not defined yet). */
    const pending = useRef(new Map<string, unknown>());
    // `class` first, as the docs write it. As `class`: React 18 writes className on a custom element as a
    // "classname" attribute.
    const className = [spec.className, props.className].filter(Boolean).join(" ");
    const dom: Record<string, unknown> = className ? { class: className } : {};
    /** [property, value, mirrors an attribute]. */
    const wanted: [string, unknown, boolean][] = [];

    for (const key of Object.keys(props)) {
      const value = props[key];
      const attr = attributes[key];
      if (attr) {
        dom[attributeKey(attr[0], attr[2])] = serialize(value, attr[3]);
        if (attr[1]) wanted.push([attr[1], value, true]);
      } else if (properties.has(key)) {
        wanted.push([key, value, false]);
      } else if (eventProps.has(key)) {
        handlers.current[key] = value;
      } else if (key === "className") {
        // Merged below.
      } else if (key === "children") {
        if (!spec.empty) dom.children = value;
        if (spec.textChildren && typeof value === "string" && props.text === undefined) wanted.push(["text", value, false]);
      } else dom[key] = value;
    }
    for (const [prop] of events) if (!(prop in props)) delete handlers.current[prop];

    const setRef = useCallback(
      (el: E | null) => {
        node.current = el;
        assignRef(forwarded, el);
      },
      [forwarded],
    );
    dom.ref = setRef;

    // Properties, once the element is defined.
    useClientLayoutEffect(() => {
      const first = !mounted.current;
      mounted.current = true;
      for (const [prop, value, mirrored] of wanted) {
        const changed = !Object.is(last.current.get(prop), value);
        last.current.set(prop, value);
        if (value !== undefined && (mirrored ? !first && changed : first || changed)) pending.current.set(prop, value);
      }
      const el = node.current;
      if (!el || !pending.current.size) return undefined;
      const apply = () => {
        const target = el as unknown as Record<string, unknown>;
        for (const [prop, value] of pending.current) if (!Object.is(target[prop], value)) target[prop] = value;
        pending.current.clear();
      };
      const ctor = customElements.get(spec.tag);
      if (ctor && el instanceof ctor) {
        apply();
        return undefined;
      }
      let live = true;
      void customElements.whenDefined(spec.tag).then(() => live && el.isConnected && apply());
      return () => {
        live = false;
      };
    });

    // Events: one listener each, calling the latest handler.
    useClientLayoutEffect(() => {
      const el = node.current;
      if (!el || !events.length) return;
      const listeners = events.map(([prop, type]) => {
        const listener = (event: Event) => (handlers.current[prop] as ((e: Event) => void) | undefined)?.(event);
        el.addEventListener(type, listener);
        return [type, listener] as const;
      });
      return () => {
        for (const [type, listener] of listeners) el.removeEventListener(type, listener);
      };
    }, []);

    // The element's definition, on the client.
    useEffect(() => {
      void spec.load?.().catch((error: unknown) => console.error(`Blip: could not load <${spec.tag}>.`, error));
    }, []);

    return createElement(spec.tag, dom);
  });
  Component.displayName = spec.name;
  return Component as unknown as ForwardRefExoticComponent<PropsWithoutRef<P> & RefAttributes<E>>;
}

/** Children of an element that draws its own content. */
export type NoChildren = { children?: never };
/** The text of an element that types or drops it in. */
export type TextChildren = { children?: string };
