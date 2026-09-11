import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import styles from "./AdminLayout.module.scss";

const COLLAPSED_STORAGE_KEY = "admin-sidebar-collapsed";
const SIDEBAR_ID = "admin-sidebar";

export const ADMIN_TABS = [
  { to: "/admin/categorias", label: "Categorías", short: "CA" },
  { to: "/admin/eventos", label: "Eventos", short: "EV" },
  { to: "/admin/inscripciones", label: "Inscripciones", short: "IN" },
  { to: "/admin/usuarios", label: "Usuarios", short: "US" },
  { to: "/admin/estados-evento", label: "Estados de evento", short: "EE" },
  {
    to: "/admin/estados-inscripcion",
    label: "Estados de inscripción",
    short: "EI",
  },
  { to: "/admin/auditoria", label: "Auditoría", short: "AU" },
] as const;

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* la preferencia es opcional */
    }
  }, [collapsed]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
      }
    }

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [drawerOpen]);

  const sidebarClassName = [
    styles.sidebar,
    collapsed ? styles.collapsed : "",
    drawerOpen ? styles.open : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.layout}>
      <div className={styles.bar}>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menu_button}
          aria-expanded={drawerOpen}
          aria-controls={SIDEBAR_ID}
          onClick={() => setDrawerOpen((open) => !open)}
        >
          Menú
        </button>
      </div>

      {drawerOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Cerrar menú"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        id={SIDEBAR_ID}
        className={sidebarClassName}
      >
        <div className={styles.sidebar_header}>
          <button
            type="button"
            className={styles.drawer_close}
            onClick={() => setDrawerOpen(false)}
          >
            Cerrar
          </button>

          <button
            type="button"
            className={styles.collapse_toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          </button>
        </div>

        <nav
          className={styles.nav}
          aria-label="Backoffice"
        >
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              title={tab.label}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.active}` : styles.tab
              }
            >
              <span
                className={styles.tab_short}
                aria-hidden="true"
              >
                {tab.short}
              </span>

              <span className={styles.tab_label}>{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
