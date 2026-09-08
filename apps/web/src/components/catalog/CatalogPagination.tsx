"use client";

import { ArrowRight } from "lucide-react";

import styles from "./catalog.module.css";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function CatalogPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={styles.navPage}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
        <button
          key={item}
          type="button"
          className={item === page ? styles.activePage : styles.pageButton}
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        className={styles.navPage}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </nav>
  );
}
