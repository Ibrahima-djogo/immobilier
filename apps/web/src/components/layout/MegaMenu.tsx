"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import type { MegaMenuDefinition, MegaMenuId } from "./mega-menus";
import styles from "./MegaMenu.module.css";

type MegaMenuProps = {
  menu: MegaMenuDefinition;
  isActive: boolean;
  openId: MegaMenuId | null;
  onOpen: (id: MegaMenuId) => void;
  onClose: () => void;
  onNavigate: () => void;
};

export function MegaMenu({
  menu,
  isActive,
  openId,
  onOpen,
  onClose,
  onNavigate,
}: MegaMenuProps) {
  const open = openId === menu.id;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const reactId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  function clearHoverTimer() {
    if (hoverTimer.current != null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }

  function handleTriggerClick() {
    if (open) onClose();
    else onOpen(menu.id);
  }

  function handleMouseEnter() {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => onOpen(menu.id), 120);
  }

  function handleMouseLeave() {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      if (openId === menu.id) onClose();
    }, 180);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(menu.id);
      window.requestAnimationFrame(() => {
        panelRef.current
          ?.querySelector<HTMLElement>("a[href]")
          ?.focus();
      });
    }
  }

  return (
    <div
      className={styles.item}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger}${isActive || open ? ` ${styles.triggerActive}` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menu.panelId}
        id={`${reactId}-trigger`}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{menu.label}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
        />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={menu.panelId}
          className={styles.panel}
          role="region"
          aria-labelledby={`${reactId}-trigger`}
          onMouseEnter={clearHoverTimer}
        >
          <div className={styles.panelInner}>
            {menu.columns.map((column) => (
              <div key={column.title} className={styles.column}>
                <p className={styles.columnTitle}>{column.title}</p>
                <ul className={styles.linkList}>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={styles.link}
                        onClick={onNavigate}
                      >
                        <span className={styles.linkCopy}>
                          <strong>{link.label}</strong>
                          {link.description ? (
                            <small>{link.description}</small>
                          ) : null}
                        </span>
                        <ArrowUpRight
                          size={16}
                          aria-hidden="true"
                          className={styles.linkArrow}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type MobileAccordionProps = {
  menu: MegaMenuDefinition;
  openId: MegaMenuId | null;
  onToggle: (id: MegaMenuId) => void;
  onNavigate: () => void;
};

export function MobileMegaAccordion({
  menu,
  openId,
  onToggle,
  onNavigate,
}: MobileAccordionProps) {
  const open = openId === menu.id;
  const panelId = `${menu.panelId}-mobile`;

  return (
    <div className={styles.mobileAccordion}>
      <button
        type="button"
        className={`${styles.mobileTrigger}${open ? ` ${styles.mobileTriggerOpen}` : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(menu.id)}
      >
        <span>{menu.label}</span>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
        />
      </button>
      {open ? (
        <div id={panelId} className={styles.mobilePanel}>
          {menu.columns.map((column) => (
            <div key={column.title} className={styles.mobileColumn}>
              <p className={styles.columnTitle}>{column.title}</p>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.mobileSubLink}
                  onClick={onNavigate}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
