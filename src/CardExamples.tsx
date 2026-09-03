import { Card } from "./components/Card/Card";
// import { CardGrid } from "./components/Card/CardGrid";

import styles from "./CardExamples.module.scss";

type PadelCard = {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  variant: "default" | "primary" | "accent";
  description: string;
  date: string;
  price?: string;
  actionLabel: string;
  disabled?: boolean;
};

const padelCards: PadelCard[] = [
  {
    id: 1,
    title: "Cancha Central",
    subtitle: "Césped sintético · Blindex",
    badge: "Disponible",
    variant: "primary",
    description:
      "Turno de 90 minutos en cancha cubierta con iluminación incluida.",
    date: "Hoy, 18:00",
    price: "$24.000",
    actionLabel: "Reservar cancha",
  },
  {
    id: 2,
    title: "Partido abierto",
    subtitle: "Nivel intermedio",
    badge: "Falta 1 jugador",
    variant: "accent",
    description:
      "Partido amistoso en Cancha Panorámica. Actualmente hay 3 de 4 jugadores.",
    date: "Sábado, 20:30",
    price: "$7.000 por jugador",
    actionLabel: "Unirme al partido",
  },
  {
    id: 3,
    title: "Reserva confirmada",
    subtitle: "Cancha 3 · Padel Point",
    badge: "Confirmada",
    variant: "default",
    description: "Tu reserva está confirmada. Código de reserva: PAD-2841.",
    date: "Domingo, 19:00",
    price: "$22.000",
    actionLabel: "Ver detalle",
  },
];

export function CardExamples() {
  function handleCardAction(card: PadelCard) {
    console.log("Card seleccionada:", card);
  }

  return (
    <div>
      {/* <CardGrid minCardWidth={280}> */}
      {padelCards.map((card) => (
        <Card
          key={card.id}
          title={card.title}
          subtitle={card.subtitle}
          badge={card.badge}
          variant={card.variant}
          description={card.description}
          footer={
            <>
              <span>{card.date}</span>

              {card.price && (
                <strong className={styles.price}>{card.price}</strong>
              )}
            </>
          }
          actions={
            <button
              type="button"
              className={styles.primaryButton}
              disabled={card.disabled}
              onClick={() => handleCardAction(card)}
            >
              {card.actionLabel}
            </button>
          }
        >
          {null}
        </Card>
      ))}
    </div>
    // </CardGrid>
  );
}
