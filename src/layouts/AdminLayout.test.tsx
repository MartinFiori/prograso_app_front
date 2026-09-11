import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import AdminLayout, { ADMIN_TABS } from "./AdminLayout";

function renderLayout(path = "/admin/categorias") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            path="categorias"
            element={<p>categorías panel</p>}
          />
          <Route
            path="eventos"
            element={<p>eventos panel</p>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("renders the seven backoffice tabs and no Exercises tab", () => {
    renderLayout();

    const nav = screen.getByRole("navigation", { name: "Backoffice" });
    expect(nav).toBeInTheDocument();

    for (const tab of ADMIN_TABS) {
      expect(screen.getByRole("link", { name: tab.label })).toBeInTheDocument();
    }

    expect(ADMIN_TABS).toHaveLength(7);
    expect(screen.queryByRole("link", { name: /exercises/i })).not.toBeInTheDocument();
  });

  test("marks the active tab from the current route", () => {
    renderLayout("/admin/eventos");

    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Categorías" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("opens the drawer from the menu button and closes it with Escape", async () => {
    renderLayout();

    const menuButton = screen.getByRole("button", { name: "Menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "admin-sidebar");

    await userEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });

  test("closes the drawer from the backdrop", async () => {
    renderLayout();

    const menuButton = screen.getByRole("button", { name: "Menú" });
    await userEvent.click(menuButton);

    await userEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Cerrar menú" }),
    ).not.toBeInTheDocument();
  });

  test("closes the drawer after navigating to another section", async () => {
    renderLayout();

    const menuButton = screen.getByRole("button", { name: "Menú" });
    await userEvent.click(menuButton);
    await userEvent.click(screen.getByRole("link", { name: "Eventos" }));

    expect(screen.getByText("eventos panel")).toBeInTheDocument();
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  test("persists the collapsed preference and keeps accessible link names", async () => {
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Colapsar menú" }));

    expect(window.localStorage.getItem("admin-sidebar-collapsed")).toBe("1");
    expect(
      screen.getByRole("button", { name: "Expandir menú" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("starts collapsed when the stored preference says so", () => {
    window.localStorage.setItem("admin-sidebar-collapsed", "1");

    renderLayout();

    expect(
      screen.getByRole("button", { name: "Expandir menú" }),
    ).toBeInTheDocument();

    for (const tab of ADMIN_TABS) {
      expect(screen.getByRole("link", { name: tab.label })).toBeInTheDocument();
    }
  });
});
