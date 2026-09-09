import { NavLink, Outlet } from "react-router-dom";

import styles from "./AdminLayout.module.scss";

export const ADMIN_TABS = [
  { to: "/admin/categorias", label: "Categorías" },
  { to: "/admin/eventos", label: "Eventos" },
  { to: "/admin/inscripciones", label: "Inscripciones" },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/estados-evento", label: "Estados de evento" },
  { to: "/admin/estados-inscripcion", label: "Estados de inscripción" },
  { to: "/admin/auditoria", label: "Auditoría" },
] as const;

export default function AdminLayout() {
  return (
    <div className={styles.layout}>
      <nav
        className={styles.tabs}
        aria-label="Backoffice"
      >
        {ADMIN_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              isActive ? `${styles.tab} ${styles.active}` : styles.tab
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
