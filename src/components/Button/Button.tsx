import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.scss";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "danger"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  fullWidth = false,
  iconOnly = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const buttonClassName = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    iconOnly ? styles.iconOnly : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      type={type}
      className={buttonClassName}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span
            className={styles.spinner}
            aria-hidden="true"
          />

          {!iconOnly ? <span>{loadingText ?? children}</span> : null}
        </>
      ) : (
        <>
          {leftIcon && (
            <span
              className={styles.icon}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <span className={iconOnly ? styles.iconOnlyContent : undefined}>
            {children}
          </span>

          {rightIcon && (
            <span
              className={styles.icon}
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
