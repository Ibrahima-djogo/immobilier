import styles from "./FieldError.module.css";

type FieldErrorProps = {
  id?: string;
  message?: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className={styles.error} role="alert">
      {message}
    </p>
  );
}

export function fieldA11y(id: string, message?: string) {
  return {
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? id : undefined,
  } as const;
}
