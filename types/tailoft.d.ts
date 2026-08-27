/**
 * All Tailoft elements, i.e. `<l-*>`, are instances of {@link HTMLElement}.
 * They are only defined as this type to make React happy (see https://react.dev/reference/react-dom/components#custom-html-elements).
 * If React ever supports `class`, this can be deleted.
 */
type CustomElement<T> = Partial<T & Omit<HTMLElement, "className"> & {
  class?: string;
  children?: any;
  /** React list key (not passed to the element). */
  key?: string | number;
}>;

/**
 * Alert component. See https://psychic-adventure-p3ngy39.pages.github.io/#alert
 */
export type TailoftAlert = CustomElement<{
  kind?: "primary" | "warning" | "danger" | "success" | "purple";
  toast?: "hide" | "show";
}>;

/**
 * Badge component. See https://psychic-adventure-p3ngy39.pages.github.io/#badge
 */
export type TailoftBadge = CustomElement<{
  kind?: "primary" | "neutral" | "danger";
  count?: string | number;
}>;

/**
 * Breadcrumbs component. See https://psychic-adventure-p3ngy39.pages.github.io/#breadcrumbs
 */
export type TailoftBreadcrumbs = CustomElement<{
}>;

/**
 * Chip component. See https://psychic-adventure-p3ngy39.pages.github.io/#chip
 */
export type TailoftChip = CustomElement<{
  kind?: "primary" | "primary-solid" | "primary-outline" | "primary-thomas" | "success" | "success-solid" | "danger" | "danger-solid" | "danger-outline" | "warning" | "warning-solid" | "neutral" | "purple" | "purple-solid";
}>;

/**
 * Container component. See https://psychic-adventure-p3ngy39.pages.github.io/#container
 */
export type TailoftContainer = CustomElement<{
  maxwidth?: "large" | "none";
}>;

/**
 * Dropdown component. See https://psychic-adventure-p3ngy39.pages.github.io/#dropdown
 */
export type TailoftDropdown = CustomElement<{
  tabindex: 0;
}>;

/**
 * FilePreview component. See https://psychic-adventure-p3ngy39.pages.github.io/#filepreview
 */
export type TailoftFilePreview = CustomElement<{
  detailview?: boolean;
}>;

/**
 * FileUpload component. See https://psychic-adventure-p3ngy39.pages.github.io/#fileupload
 */
export type TailoftFileUpload = CustomElement<{
}>;

/**
 * Icon component. See https://psychic-adventure-p3ngy39.pages.github.io/#icon
 */
export type TailoftIcon = CustomElement<{
  name:
    /* Brand icons */
    | "facebook"
    | "linkedin"
    | "youtube"
    | "x-twitter"
    /* Regular and solid icons */
    | "alarm-clock"
    | "angle-down"
    | "angle-left"
    | "angle-right"
    | "angle-up"
    | "arrow-down"
    | "arrow-down-to-line"
    | "arrow-left"
    | "arrow-right"
    | "arrow-right-arrow-left"
    | "arrow-right-from-bracket"
    | "arrow-right-to-bracket"
    | "arrow-rotate-left"
    | "arrow-rotate-right"
    | "arrow-up"
    | "arrow-up-arrow-down"
    | "arrow-up-from-line"
    | "arrow-up-right-from-square"
    | "arrows-to-line"
    | "award"
    | "ban"
    | "barcode-read"
    | "bars"
    | "bell"
    | "blog"
    | "bold"
    | "book"
    | "bookmark"
    | "box-archive"
    | "box-taped"
    | "calendar"
    | "caret-down"
    | "caret-left"
    | "caret-right"
    | "caret-up"
    | "check"
    | "circle-check"
    | "circle-dollar"
    | "circle-exclamation"
    | "circle-info"
    | "circle-play"
    | "circle-plus"
    | "circle-quarter"
    | "circle-question"
    | "circle-star"
    | "circle-user"
    | "circle-xmark"
    | "clipboard-check"
    | "clock"
    | "cloud-arrow-down"
    | "cloud-arrow-up"
    | "code"
    | "comment"
    | "comment-dollar"
    | "comment-dots"
    | "copy"
    | "credit-card"
    | "cube"
    | "diagram-subtask"
    | "diamond"
    | "download"
    | "earth-europe"
    | "ellipsis"
    | "ellipsis-vertical"
    | "envelope"
    | "eye"
    | "eye-slash"
    | "file-arrow-down"
    | "file-certificate"
    | "file-circle-xmark"
    | "file-lines"
    | "file-pdf"
    | "floppy-disk"
    | "forward"
    | "gear"
    | "globe"
    | "grid"
    | "hashtag"
    | "house"
    | "image"
    | "industry"
    | "italic"
    | "landmark"
    | "link"
    | "list-check"
    | "list-ol"
    | "list-ul"
    | "location-dot"
    | "magnifying-glass"
    | "minus"
    | "octagon-xmark"
    | "paper-plane"
    | "paperclip"
    | "parachute-box"
    | "pen"
    | "pen-to-square"
    | "phone"
    | "piggy-bank"
    | "plus"
    | "print"
    | "qrcode"
    | "quote-right"
    | "rocket"
    | "rotate"
    | "ruler-triangle"
    | "screwdriver-wrench"
    | "share-from-square"
    | "share-nodes"
    | "shield-check"
    | "sliders"
    | "sparkles"
    | "spinner"
    | "square-arrow-up-right"
    | "square-pen"
    | "star"
    | "strikethrough"
    | "subscript"
    | "superscript"
    | "tag"
    | "trash-can"
    | "triangle-exclamation"
    | "truck"
    | "underline"
    | "user"
    | "user-group"
    | "user-plus"
    | "users"
    | "users-medical"
    | "video"
    | "xmark";
  fill?: boolean;
}>;

/**
 * Loader component. See https://psychic-adventure-p3ngy39.pages.github.io/#loader
 */
export type TailoftLoader = CustomElement<{
  kind: "flow" | "spinner";
  role: "progressbar";
}>;

/**
 * Pagination component. See https://psychic-adventure-p3ngy39.pages.github.io/#pagination
 */
export type TailoftPagination = CustomElement<{
}>;

/**
 * Panel component. See https://psychic-adventure-p3ngy39.pages.github.io/#panel
 */
export type TailoftPanel = CustomElement<{
}>;

/**
 * Tabs component. See https://psychic-adventure-p3ngy39.pages.github.io/#tabs
 */
export type TailoftTabs = CustomElement<{
  role: "tablist";
  kind?: "left" | "center" | "right" | "fixed";
}>;


/**
 * Tailoft custom elements.
 */
export interface TailoftCustomElements {
  'l-alert': TailoftAlert;
  'l-badge': TailoftBadge;
  'l-breadcrumbs': TailoftBreadcrumbs;
  'l-chip': TailoftChip;
  'l-container': TailoftContainer;
  'l-dropdown': TailoftDropdown;
  'l-filepreview': TailoftFilePreview;
  'l-fileupload': TailoftFileUpload;
  'l-icon': TailoftIcon;
  'l-loader': TailoftLoader;
  'l-pagination': TailoftPagination;
  'l-panel': TailoftPanel;
  'l-tabs': TailoftTabs;
}

/**
 * Add Tailoft tags to HTML.
 */
export interface TailoftElements extends HTMLElementTagNameMap, TailoftCustomElements {
}

/**
 * Make JSX aware of our custom elements.
 */
declare global {
  namespace JSX {
    interface IntrinsicElements extends TailoftCustomElements {
    }
  }

  namespace React {
    namespace JSX {
      interface IntrinsicElements extends TailoftCustomElements {
      }
    }

    /**
     * Defines custom attributes on native elements.
     * NOTE: Per the TAC CSS methodology this is done with care and
     * must always be a styles-only implementation.
     */
    interface ButtonHTMLAttributes<T> {
      kind?:
        | "primary"
        | "primary-outline"
        | "primary-text"
        | "neutral"
        | "neutral-text"
        | "danger"
        | "danger-outline"
        | "danger-text"
        | "warning"
        | "angle";
      scale?: "small" | "medium" | "large" | "xlarge";
      direction?: "left" | "right";
    }

    interface AnchorHTMLAttributes<T> {
      kind?: "dark";
    }

    interface DialogHTMLAttributes<T> {
      kind?: "slideover";
      alignment?: "right" | "left";
    }

    interface DetailsHTMLAttributes<T> {
      kind?: "collapse" | "accordion";
    }
  }
}
