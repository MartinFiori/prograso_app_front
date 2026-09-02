declare module "*.css";

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.scss";

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.sass";

declare module "*.module.sass" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.svg" {
  const src: string;
  export default src;
}
