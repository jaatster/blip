import data from "@jaatster/blip-icons/icons.json";

const ICONS = new Map((data as { icons: { name: string; path: string; evenodd?: boolean }[] }).icons.map((i) => [i.name, i]));

/** A Blip icon, as the docs draw them: its 12 x 12 path in a .blip-icon. */
export const Icon = ({ name }: { readonly name: string }) => {
  const icon = ICONS.get(name);
  if (!icon) throw new Error(`no Blip icon named "${name}"`);
  return (
    <svg className="blip-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d={icon.path} fillRule={icon.evenodd ? "evenodd" : undefined} />
    </svg>
  );
};
