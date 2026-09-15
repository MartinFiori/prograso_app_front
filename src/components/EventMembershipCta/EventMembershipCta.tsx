import { FormEvent, MouseEvent, useCallback, useState } from "react";

import { Avatar } from "../Avatar/Avatar";
import { Button } from "../Button/Button";
import { Modal } from "../Modal/Modal";
import { useEventMembership } from "../../hooks/useEventMembership";
import { isConnectionError, useConnection } from "../../hooks/useConnection";
import { searchPlayersPath } from "../../services/eventsApi";
import type { ApiResponse } from "../../types";
import type { PlayerSearchResult } from "../../types/events";
import styles from "./EventMembershipCta.module.scss";

interface EventMembershipCtaProps {
  eventId: number | null;
  participantsPerRegistration?: 1 | 2;
  onMembershipChanged?: () => void;
}

function stopCardSelect(event: MouseEvent<HTMLDivElement>) {
  event.stopPropagation();
}

export function EventMembershipCta({
  eventId,
  participantsPerRegistration = 1,
  onMembershipChanged,
}: EventMembershipCtaProps) {
  const { state, inFlight, join, leave } = useEventMembership(eventId);
  const connection = useConnection();
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [selected, setSelected] = useState<PlayerSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const closePairModal = useCallback(() => setPairModalOpen(false), []);

  async function handleJoin(companionUserId?: string) {
    const changed = await join(companionUserId);
    if (changed) {
      setPairModalOpen(false);
      onMembershipChanged?.();
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchError("Ingresá al menos dos letras.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSelected(null);
    const result = await connection<ApiResponse<PlayerSearchResult[]>>({
      url: searchPlayersPath(trimmed),
    });
    setSearching(false);

    if (isConnectionError(result)) {
      setResults([]);
      setSearchError(result.message);
      return;
    }

    setResults(result.data ?? []);
  }

  async function handleLeave() {
    const changed = await leave();
    if (changed) {
      onMembershipChanged?.();
    }
  }

  if (eventId === null || state.status === "idle") {
    return null;
  }

  return (
    <div
      className={styles.cta}
      onClick={stopCardSelect}
    >
      {state.status === "loading" ? (
        <p className={styles.status}>Cargando tu inscripción...</p>
      ) : null}

      {state.status === "anonymous" ? (
        <Button
          onClick={() => void handleJoin()}
          disabled={inFlight}
        >
          Anotarme
        </Button>
      ) : null}

      {state.status === "not-joined" ? (
        <Button
          onClick={() =>
            participantsPerRegistration === 2
              ? setPairModalOpen(true)
              : void handleJoin()
          }
          loading={inFlight}
          disabled={inFlight}
        >
          {participantsPerRegistration === 2
            ? "Anotarme con compañero"
            : "Anotarme"}
        </Button>
      ) : null}

      {state.status === "joined" && state.registration.status_code === "confirmed" ? (
        <>
          <p className={styles.status}>
            Inscripto
            {state.registration.companion
              ? ` con ${state.registration.companion.name}`
              : ""}
          </p>
          <Button
            variant="secondary"
            onClick={() => void handleLeave()}
            loading={inFlight}
            disabled={inFlight}
          >
            Darme de baja
          </Button>
        </>
      ) : null}

      {state.status === "joined" && state.registration.status_code === "waitlisted" ? (
        <>
          <p className={styles.status}>
            En espera
            {state.registration.waitlist_position != null
              ? ` (${state.registration.waitlist_position})`
              : ""}
          </p>
          <Button
            variant="secondary"
            onClick={() => void handleLeave()}
            loading={inFlight}
            disabled={inFlight}
          >
            Darme de baja
          </Button>
        </>
      ) : null}

      {state.status === "error" ? (
        <p
          className={styles.error}
          role="alert"
        >
          {state.errorCode && !state.message.includes(state.errorCode)
            ? `${state.message} (${state.errorCode})`
            : state.message}
        </p>
      ) : null}

      <Modal
        open={pairModalOpen}
        title="Elegí a tu compañero"
        onClose={closePairModal}
        busy={inFlight}
      >
        <form
          className={styles.searchForm}
          onSubmit={(event) => void handleSearch(event)}
        >
          <label htmlFor="companion-search">Buscar por nombre</label>
          <div className={styles.searchRow}>
            <input
              id="companion-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nombre del jugador"
              minLength={2}
            />
            <Button type="submit" loading={searching} disabled={searching}>
              Buscar
            </Button>
          </div>
        </form>

        {searchError ? <p className={styles.error}>{searchError}</p> : null}
        {!searching && query.trim().length >= 2 && results.length === 0 && !searchError ? (
          <p>No encontramos jugadores con ese nombre.</p>
        ) : null}

        {results.length > 0 ? (
          <div className={styles.results}>
            {results.map((player) => (
              <button
                key={player.id}
                type="button"
                className={`${styles.player} ${
                  selected?.id === player.id ? styles.playerSelected : ""
                }`}
                onClick={() => setSelected(player)}
                aria-pressed={selected?.id === player.id}
              >
                <Avatar src={player.avatar_url} name={player.name} />
                <span>{player.name || "Usuario"}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.modalActions}>
          <Button
            onClick={() => selected && void handleJoin(selected.id)}
            loading={inFlight}
            disabled={!selected || inFlight}
          >
            Confirmar pareja
          </Button>
          <Button
            variant="ghost"
            disabled={inFlight}
            onClick={closePairModal}
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
