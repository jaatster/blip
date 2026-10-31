/**
 * Components that can render as another element: `<Stack as="ul">`. The props follow the element: `<Stack
 * as="a" href="…">` takes anchor props and its ref is an HTMLAnchorElement.
 */
import type { ComponentPropsWithoutRef, ComponentRef, ElementType, ReactElement, Ref } from "react";

/** A component's own props, `as`, and the chosen element's props (minus the own ones). */
export type PolymorphicProps<T extends ElementType, Own> = Own & { as?: T } & Omit<ComponentPropsWithoutRef<T>, keyof Own | "as">;

/** A forwardRef component whose props and ref follow its `as` element (D by default). */
export interface PolymorphicComponent<D extends ElementType, Own> {
  <T extends ElementType = D>(props: PolymorphicProps<T, Own> & { ref?: Ref<ComponentRef<T>> }): ReactElement | null;
  displayName?: string;
}
