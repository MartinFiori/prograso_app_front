export type EventCategoryEmbed = {
  id: number;
  name: string;
  image_url: string | null;
};

export type PublicEvent = {
  id: number;
  category_id: number;
  title: string;
  starts_at: string;
  registration_deadline: string | null;
  capacity: number;
  price: number;
  status_code: string;
  category: EventCategoryEmbed;
};

export type EventCategory = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EventStatus = {
  code: string;
  label: string;
  description: string | null;
};

export const PUBLIC_EVENT_STATUS_CODES = ["open", "closed", "completed"] as const;

export type PublicEventStatusCode = (typeof PUBLIC_EVENT_STATUS_CODES)[number];

export type ListEventsQuery = {
  category_id?: number;
  status_code?: string;
  starts_from?: string;
  starts_to?: string;
  page?: number;
  limit?: number;
};

export type PublicProfileEmbed = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type EventRegistrationWithProfile = {
  id: number;
  event_id: number;
  user_id: string;
  status_code: string;
  waitlist_position: number | null;
  created_at: string;
  updated_at: string;
  profile: PublicProfileEmbed;
};

export type UserEventRegistration = {
  id: number;
  event_id: number;
  user_id: string;
  status_code: string;
  waitlist_position: number | null;
  created_at: string;
  updated_at: string;
};
