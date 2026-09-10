import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Modal } from "./Modal";

describe("Modal", () => {
  test("moves focus inside and restores it after Escape", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
          >
            Abrir
          </button>
          <Modal
            open={open}
            title="Detalle"
            onClose={() => setOpen(false)}
          >
            <p>Contenido</p>
          </Modal>
        </>
      );
    }

    render(<Harness />);

    const opener = screen.getByRole("button", { name: "Abrir" });
    opener.focus();
    await userEvent.click(opener);

    expect(screen.getByRole("dialog", { name: "Detalle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
