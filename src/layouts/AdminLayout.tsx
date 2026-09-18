import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiGrid,
  FiList,
  FiMenu,
  FiUsers,
  FiX,
} from "react-icons/fi";

import styles from "./AdminLayout.module.scss";

const COLLAPSED_STORAGE_KEY = "admin-sidebar-collapsed";
const SIDEBAR_ID = "admin-sidebar";
const SIDEBAR_TITLE_ID = "admin-sidebar-title";

export const ADMIN_TABS = [
  { to: "/admin/categorias", label: "Categorías", icon: FiGrid },
  { to: "/admin/eventos", label: "Eventos", icon: FiCalendar },
  { to: "/admin/usuarios", label: "Usuarios", icon: FiUsers },
  { to: "/admin/estados-evento", label: "Estados de evento", icon: FiList },
  {
    to: "/admin/estados-inscripcion",
    label: "Estados de inscripción",
    icon: FiFileText,
  },
  { to: "/admin/auditoria", label: "Auditoría", icon: FiFileText },
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
  const currentTab = ADMIN_TABS.find(
    (tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`),
  );
  const currentLabel = currentTab?.label ?? "Administración";

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
          aria-label="Menú"
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <FiMenu aria-hidden="true" />
        </button>

        <div className={styles.bar_context}>
          <span className={styles.area_label}>Administración</span>
          <span className={styles.current_label}>{currentLabel}</span>
        </div>
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
        aria-labelledby={SIDEBAR_TITLE_ID}
      >
        <div className={styles.sidebar_header}>
          <div className={styles.drawer_context}>
            <h2
              id={SIDEBAR_TITLE_ID}
              className={styles.drawer_title}
            >
              Administración
            </h2>
            <span className={styles.drawer_current}>{currentLabel}</span>
          </div>

          <button
            type="button"
          className={styles.drawer_close}
          aria-label="Cerrar panel lateral"
            onClick={() => setDrawerOpen(false)}
          >
            <FiX aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.collapse_toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <span aria-hidden="true">
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </span>
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
              <span className={styles.tab_short} aria-hidden="true">
                <tab.icon />
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
