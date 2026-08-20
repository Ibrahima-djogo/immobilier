import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
  disabled?: boolean;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: CommonProps) {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
  } = props;
  const resolvedClassName = buttonClassName({
    children,
    variant,
    size,
    fullWidth,
    className,
  });

  if ("href" in props && props.href) {
    if (props.disabled) {
      return (
        <span className={resolvedClassName} aria-disabled="true">
          {children}
        </span>
      );
    }
    return (
      <Link href={props.href} className={resolvedClassName}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  const {
    type = "button",
    variant: _v,
    size: _s,
    fullWidth: _f,
    className: _c,
    children: _children,
    ...rest
  } = buttonProps;

  return (
    <button type={type} className={resolvedClassName} {...rest}>
      {children}
    </button>
  );
}
