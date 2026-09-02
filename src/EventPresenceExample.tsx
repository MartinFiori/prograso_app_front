import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";

import { supabase } from "./utils/supabase";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

type EventPresence = {
  userId: string;
  displayName: string;
  onlineAt: string;
  presence_ref?: string;
};

type UseEventPresenceParams = {
  eventId: string;
  user: User | null;
  autoConnect?: boolean;
};

type EventPresenceExampleProps = {
  eventId: string;
  user: User | null;
};

/**
 * Convierte el estado interno de Presence en una lista sin usuarios repetidos.
 * Si un usuario abre varias pestañas, se muestra una sola vez.
 */
function getConnectedUsers(channel: RealtimeChannel): EventPresence[] {
  const presenceState = channel.presenceState();
  const usersById = new Map<string, EventPresence>();

  Object.values(presenceState).forEach((presences) => {
    presences.forEach((rawPresence) => {
      const presence = rawPresence as unknown as EventPresence;

      if (presence.userId) {
        usersById.set(presence.userId, presence);
      }
    });
  });

  return Array.from(usersById.values());
}

/**
 * Conecta al usuario al canal privado `event:<eventId>`.
 *
 * Presence detecta automáticamente:
 * - usuarios que se conectan;
 * - usuarios que salen voluntariamente;
 * - pestañas cerradas;
 * - conexiones perdidas.
 */
export function useEventPresence({
  eventId,
  user,
  autoConnect = true,
}: UseEventPresenceParams) {
  const [shouldConnect, setShouldConnect] = useState(autoConnect);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [connectedUsers, setConnectedUsers] = useState<EventPresence[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connectToEvent = useCallback(() => {
    setError(null);
    setShouldConnect(true);
  }, []);

  const disconnectFromEvent = useCallback(() => {
    setShouldConnect(false);
    setConnectedUsers([]);
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    if (!shouldConnect || !eventId || !user) {
      setConnectedUsers([]);
      setStatus("disconnected");
      return;
    }

    let effectIsActive = true;
    let activeChannel: RealtimeChannel | null = null;
    const topic = `event:${eventId}`;
    const displayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "Usuario";

    // async function connectRoomEvent() {
    //   // const roomId = `event:${eventId}`;
    //   await supabase.realtime.setAuth();

    //   const channel = supabase
    //     .channel(`room:${eventId}:messages`, {
    //       config: {
    //         private: true,
    //       },
    //     })
    //     .on(
    //       "broadcast",
    //       {
    //         event: "message_created",
    //       },
    //       (payload) => {
    //         // console.log("new message:", payload);
    //         const eventType = payload.evenType;
    //         const newRecord = payload.new;
    //         const oldRecord = payload.old;
    //         console.log(eventType, newRecord, oldRecord);
    //       },
    //     )
    //     .subscribe();
    // }

    // connectRoomEvent();

    setStatus("connecting");
    setError(null);

    const createAndSubscribeChannel = async () => {
      /*
       * supabase.channel(topic) devuelve el canal existente si todavía sigue
       * registrado. En React StrictMode el efecto se monta dos veces y la
       * limpieza anterior puede seguir ejecutándose de forma asíncrona.
       * Esperamos a que desaparezca cualquier instancia anterior antes de
       * registrar los callbacks del canal nuevo.
       */
      const realtimeTopic = `realtime:${topic}`;
      const previousChannel = supabase
        .getChannels()
        .find((existingChannel) => existingChannel.topic === realtimeTopic);

      if (previousChannel) {
        await supabase.removeChannel(previousChannel);
      }

      if (!effectIsActive) return;

      const channel = supabase.channel(topic, {
        config: {
          private: true,
          presence: {
            // Agrupa las conexiones de un mismo usuario, incluso con varias pestañas.
            key: user.id,
          },
        },
      });

      activeChannel = channel;

      const synchronizeUsers = () => {
        if (effectIsActive) {
          setConnectedUsers(getConnectedUsers(channel));
        }
      };

      // Todos los callbacks deben registrarse ANTES de llamar a subscribe().
      channel
        .on("presence", { event: "sync" }, synchronizeUsers)
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("Usuario conectado al evento:", key, newPresences);
          synchronizeUsers();
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("Usuario desconectado del evento:", key, leftPresences);
          synchronizeUsers();
        });

      channel.subscribe(async (subscriptionStatus, subscriptionError) => {
        if (!effectIsActive) return;

        if (subscriptionStatus === "SUBSCRIBED") {
          const trackResult = await channel.track({
            userId: user.id,
            displayName,
            onlineAt: new Date().toISOString(),
          });

          if (!effectIsActive) return;

          if (trackResult === "ok") {
            setStatus("connected");
          } else {
            setStatus("error");
            setError(`No se pudo publicar la presencia: ${trackResult}`);
          }

          return;
        }

        if (
          subscriptionStatus === "CHANNEL_ERROR" ||
          subscriptionStatus === "TIMED_OUT"
        ) {
          setStatus("error");
          setError(
            subscriptionError?.message ??
              `Error de Realtime: ${subscriptionStatus}`,
          );
        }

        if (subscriptionStatus === "CLOSED") {
          setStatus("disconnected");
        }
      });
    };

    void createAndSubscribeChannel();

    return () => {
      effectIsActive = false;

      // removeChannel() también elimina Presence y genera "leave".
      // No esperamos primero a untrack(), porque eso deja una ventana en la
      // que React StrictMode puede recuperar el canal anterior ya suscripto.
      if (activeChannel) {
        void supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };
  }, [eventId, shouldConnect, user]);

  return {
    connectedUsers,
    status,
    error,
    connectToEvent,
    disconnectFromEvent,
  };
}

export default function EventPresenceExample({
  eventId,
  user,
}: EventPresenceExampleProps) {
  const { connectedUsers, status, error, connectToEvent, disconnectFromEvent } =
    useEventPresence({ eventId, user });

  if (!user) {
    return <p>Iniciá sesión para ingresar al evento.</p>;
  }

  return (
    <section>
      <h2>Evento {eventId}</h2>
      <p>Estado del socket: {status}</p>

      {error && <p role="alert">{error}</p>}

      {status === "connected" || status === "connecting" ? (
        <button
          type="button"
          onClick={disconnectFromEvent}
        >
          Salir del evento
        </button>
      ) : (
        <button
          type="button"
          onClick={connectToEvent}
        >
          Conectarme al evento
        </button>
      )}

      <h3>Usuarios conectados ({connectedUsers.length})</h3>

      {connectedUsers.length === 0 ? (
        <p>No hay usuarios conectados.</p>
      ) : (
        <ul>
          {connectedUsers.map((connectedUser) => (
            <li key={connectedUser.userId}>
              {connectedUser.displayName}
              {connectedUser.userId === user.id ? " (vos)" : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/*
CONFIGURACION SQL PARA EL EJEMPLO
---------------------------------

Ejecutá estas políticas una sola vez desde el SQL Editor de Supabase.
Permiten Presence solamente en canales privados cuyo nombre empiece con event:.

create policy "authenticated users can read event presence"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'presence'
  and (select realtime.topic()) like 'event:%'
);

create policy "authenticated users can write event presence"
on realtime.messages
for insert
to authenticated
with check (
  realtime.messages.extension = 'presence'
  and (select realtime.topic()) like 'event:%'
);

En Realtime Settings también podés desactivar "Allow public access" para exigir
canales privados en todo el proyecto.

USO
---

const { data: { user } } = await supabase.auth.getUser();

<EventPresenceExample
  eventId="550e8400-e29b-41d4-a716-446655440000"
  user={user}
/>
*/
