export function homePath(): string {
  return "/";
}

export function categoryEventsPath(categoryId: number): string {
  return `/event/${categoryId}`;
}

export function eventDetailPath(categoryId: number, eventId: number): string {
  return `/event/${categoryId}/${eventId}`;
}
