import {
  createCategoryPath,
  createEventPath,
  deleteCategoryPath,
  deleteEventPath,
  getAdminEventByIdPath,
  getCategoryByIdPath,
  getMePath,
  patchMePath,
  getMyRegistrationPath,
  listAdminEventsPath,
  listAdminRegistrationsPath,
  listCategoriesPath,
  listEventsPath,
  listRegistrationsByEventPath,
  parseEventIdParam,
  registerForEventPath,
  syncAdminRegistrationsPath,
  unregisterFromEventPath,
  updateCategoryPath,
  updateEventPath,
} from "./eventsApi";

describe("eventsApi", () => {
  test("builds list path with defaults and omits empty filters", () => {
    expect(listEventsPath()).toBe("/events?page=1&limit=20");
    expect(listEventsPath({ page: 2, category_id: 3, status_code: "open" })).toBe(
      "/events?category_id=3&status_code=open&page=2&limit=20",
    );
  });

  test("builds registrations path for an event", () => {
    expect(listRegistrationsByEventPath(25)).toBe(
      "/events/25/registrations?page=1&limit=20",
    );
    expect(listRegistrationsByEventPath(25, { page: 2, limit: 10 })).toBe(
      "/events/25/registrations?page=2&limit=10",
    );
  });

  test("parses event id params", () => {
    expect(parseEventIdParam("1")).toBe(1);
    expect(parseEventIdParam("abc")).toBeNull();
    expect(parseEventIdParam("0")).toBeNull();
    expect(parseEventIdParam(undefined)).toBeNull();
  });

  test("builds admin event and registration paths", () => {
    expect(listAdminEventsPath()).toBe("/admin/events?page=1&limit=20");
    expect(getAdminEventByIdPath(12)).toBe("/admin/events/12");
    expect(createEventPath()).toBe("/events");
    expect(updateEventPath(12)).toBe("/events/12");
    expect(deleteEventPath(12)).toBe("/events/12");
    expect(listAdminRegistrationsPath(4)).toBe(
      "/admin/events/4/registrations?page=1&limit=20",
    );
    expect(syncAdminRegistrationsPath(4)).toBe("/admin/events/4/registrations");
    expect(registerForEventPath(4)).toBe("/events/4/registrations");
    expect(getMyRegistrationPath(4)).toBe("/events/4/registrations/me");
    expect(unregisterFromEventPath(4)).toBe("/events/4/registrations/me");
  });

  test("builds category and me paths", () => {
    expect(getMePath()).toBe("/me");
    expect(patchMePath()).toBe("/me");
    expect(listCategoriesPath()).toBe("/event-categories");
    expect(createCategoryPath()).toBe("/event-categories");
    expect(getCategoryByIdPath(2)).toBe("/event-categories/2");
    expect(updateCategoryPath(2)).toBe("/event-categories/2");
    expect(deleteCategoryPath(2)).toBe("/event-categories/2");
  });
});
