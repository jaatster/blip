/**
 * File drop: FileDropZone, FileDropList, FileDropItem, FileDropName, FileDropSize and FileDropRemove, the parts that
 * go inside <FileDrop>, and <FileDrop> itself (generated from its element, re-exported here). CSS from
 * @blip/components (file-drop.css).
 */
import { forwardRef } from "react";
import { cx, type NativeProps } from "../internal/props.js";

export { FileDrop, type FileDropProps } from "../generated/elements.js";

/** A control with no words of its own needs a name: `aria-label`, or `aria-labelledby` naming the words' id. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

// File drop: the parts of `FileDrop` (<blip-file-drop>), which adds dropping, the list of files and removing.

/** Props for {@link FileDropZone}. */
export type FileDropZoneProps = NativeProps<"label">;

/**
 * The tray of a `FileDrop`: the calm well, a `<label>` round the native file input, so a click anywhere opens the
 * picker while the input keeps the focus, the keys and the form value. Put the input in it, then say what to drop in
 * a `<strong>` and what's accepted in a line under it (the input's aria-describedby). Renders `<label class="blip-box
 * blip-file-drop-zone">`.
 *
 *   <FileDrop>
 *     <FileDropZone>
 *       <input type="file" name="shots" multiple accept="image/png, image/jpeg" aria-describedby="shots-help" />
 *       <Icon name="upload" size="lg" />
 *       <strong>Drop screenshots here</strong>
 *       <span id="shots-help">or click to browse. PNG or JPG.</span>
 *     </FileDropZone>
 *   </FileDrop>
 */
export const FileDropZone = /*#__PURE__*/ forwardRef<HTMLLabelElement, FileDropZoneProps>(function FileDropZone(
  { className, ...rest },
  ref,
) {
  return <label ref={ref} className={cx("blip-box blip-file-drop-zone", className)} {...rest} />;
});

/** Props for {@link FileDropList}. */
export type FileDropListProps = NativeProps<"ul">;

/**
 * The list of picked files, under the tray. `FileDrop` adds one by itself and fills it; put this in it, empty, to
 * place or name the list yourself (it fills the first it finds). Renders `<ul class="blip-file-drop-list">`; empty, it
 * takes no room.
 *
 *   <FileDropList aria-label="Screenshots to send" />
 */
export const FileDropList = /*#__PURE__*/ forwardRef<HTMLUListElement, FileDropListProps>(function FileDropList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-file-drop-list", className)} {...rest} />;
});

/** Props for {@link FileDropItem}. */
export type FileDropItemProps = NativeProps<"li">;

/**
 * One file in a {@link FileDropList}: its name, its size and its remove button. `FileDrop` draws these rows itself
 * (and replaces whatever its list holds), so render them only in a list outside it. Renders `<li class="blip-box
 * blip-file-drop-item">`.
 *
 *   <FileDropList aria-label="Files">
 *     <FileDropItem>
 *       <FileDropName title="castle-sunset.png">castle-sunset.png</FileDropName>
 *       <FileDropSize>184 kB</FileDropSize>
 *       <FileDropRemove aria-label="Remove castle-sunset.png" onClick={remove} />
 *     </FileDropItem>
 *   </FileDropList>
 */
export const FileDropItem = /*#__PURE__*/ forwardRef<HTMLLIElement, FileDropItemProps>(function FileDropItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("blip-box blip-file-drop-item", className)} {...rest} />;
});

/** Props for {@link FileDropName}. */
export type FileDropNameProps = NativeProps<"span">;

/**
 * A file's name in a {@link FileDropItem}, bold, cut with an ellipsis when long: give the full name as its title.
 * Renders `<span class="blip-file-drop-name">`.
 *
 *   <FileDropName title="castle-sunset.png">castle-sunset.png</FileDropName>
 */
export const FileDropName = /*#__PURE__*/ forwardRef<HTMLSpanElement, FileDropNameProps>(function FileDropName(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-file-drop-name", className)} {...rest} />;
});

/** Props for {@link FileDropSize}. */
export type FileDropSizeProps = NativeProps<"span">;

/**
 * A file's size in a {@link FileDropItem}, muted, in tabular digits. Renders `<span class="blip-file-drop-size">`.
 *
 *   <FileDropSize>1.2 MB</FileDropSize>
 */
export const FileDropSize = /*#__PURE__*/ forwardRef<HTMLSpanElement, FileDropSizeProps>(function FileDropSize(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-file-drop-size", className)} {...rest} />;
});

/** Props for {@link FileDropRemove}. */
export type FileDropRemoveProps = Named & Omit<NativeProps<"button">, "children">;

/**
 * A file's remove button in a {@link FileDropItem}: a ghost box with a pixel cross, named "Remove" and the file's
 * name. Renders `<button type="button" class="blip-box blip-file-drop-remove" data-variant="ghost"><span
 * aria-hidden="true"></span></button>`.
 *
 *   <FileDropRemove aria-label="Remove castle-sunset.png" onClick={remove} />
 */
export const FileDropRemove = /*#__PURE__*/ forwardRef<HTMLButtonElement, FileDropRemoveProps>(function FileDropRemove(
  { type = "button", className, ...rest },
  ref,
) {
  const classes = cx("blip-box blip-file-drop-remove", className);
  return (
    <button ref={ref} type={type} className={classes} data-variant="ghost" {...rest}>
      <span aria-hidden />
    </button>
  );
});
