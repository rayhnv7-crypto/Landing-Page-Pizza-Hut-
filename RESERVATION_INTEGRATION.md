# Reservation Form — Backend Integration Guide

The "Reserve Your Table" form on the landing page (`index.html`, section
`#reservation`) is wired to call a reservation API, but the **reservation
system repository was not available** when this integration was built. This
document specifies the contract the frontend expects, so the connection can
be finished/adjusted once that repo is accessible — without re-touching the
landing page beyond the points listed in "What to change" below.

## Current state of the frontend

- The form posts JSON to `RESERVATION_API_ENDPOINT` via `fetch()`.
- All integration code lives in **one place**: `js/script.js`, in the
  "Reservation form" section (search for `RESERVATION_API_ENDPOINT`).
- UI states already implemented:
  - **Submitting**: submit button is disabled and shows "Sending...".
  - **Success**: form is hidden, `#formSuccess` message is shown, form
    resets and re-shows after 6s.
  - **Error**: `#formError` message is shown (network failure or non-2xx
    response), form stays filled in so the user can retry.
- Client-side validation uses the existing HTML5 `required`/`type`
  attributes (`reservationForm.checkValidity()`), unchanged.

## What to change once the reservation repo is available

1. **Endpoint** — update `RESERVATION_API_ENDPOINT` in `js/script.js` to
   the real URL/path (e.g. `https://api.firestonepizza.com/v1/reservations`
   or a same-origin path like `/api/reservations`).
2. **Payload field names** — if the real API uses different field names
   than below, edit `buildReservationPayload()` (single function) to match.
3. **Time format** — if the API expects the original "7:00 PM" label
   instead of 24h `"19:00"`, drop the `RESERVATION_TIME_LABEL_TO_24H`
   lookup and send `timeLabel` directly.
4. **Party size** — if the API wants the raw label ("4 Guests" /
   "7+ Guests (call us)") instead of an integer, send `partySizeLabel`
   instead of `partySize`.
5. **Auth / CORS** — see "Auth & CORS" below.
6. **Response handling** — if the API returns a body that should be shown
   to the user (e.g. a confirmation/reference number), extend the success
   branch in the submit handler to read `response.json()` and display it.

## Request contract (as currently implemented)

```
POST <RESERVATION_API_ENDPOINT>
Content-Type: application/json
Accept: application/json
```

### Payload schema sent by the form

```json
{
  "name": "Sofia Marchetti",
  "email": "sofia@example.com",
  "phone": "+1 (212) 555-0148",
  "date": "2026-06-20",
  "time": "19:00",
  "partySize": 4,
  "partySizeLabel": "4 Guests",
  "occasion": "Anniversary",
  "specialRequests": "Window seat please",
  "source": "website"
}
```

| Field             | Type             | Source (form field)        | Notes                                                                 |
|-------------------|------------------|-----------------------------|------------------------------------------------------------------------|
| `name`            | string           | `#resName` (`name`)         | required                                                               |
| `email`           | string           | `#resEmail` (`email`)       | required, HTML5 `type=email` validated                                 |
| `phone`           | string           | `#resPhone` (`phone`)       | required, free-text (e.g. `+1 (212) 555-0100`)                         |
| `date`            | string (`YYYY-MM-DD`) | `#resDate` (`date`)    | required, HTML5 date input, min date = today                          |
| `time`            | string (`HH:mm`, 24h) | `#resTime` (`time`)    | required; mapped from a 12h label, see table below                    |
| `partySize`       | integer or `null`     | `#resGuests` (`guests`)| required; parsed from `"N Guests"`; `null` if unparseable (e.g. `"7+ Guests (call us)"`) |
| `partySizeLabel`  | string           | `#resGuests` (`guests`)     | raw select label, kept for display/fallback                           |
| `occasion`        | string or `null`     | `#resOccasion` (`occasion`) | optional; `null` when "No special occasion" is selected            |
| `specialRequests` | string or `null`     | `#resMessage` (`message`)   | optional free text                                                  |
| `source`          | string `"website"`   | constant                    | lets the dashboard distinguish web vs. phone/walk-in reservations    |

### Time label → 24h mapping (`#resTime` options)

| Label     | `time` sent |
|-----------|-------------|
| 5:00 PM   | 17:00 |
| 5:30 PM   | 17:30 |
| 6:00 PM   | 18:00 |
| 6:30 PM   | 18:30 |
| 7:00 PM   | 19:00 |
| 7:30 PM   | 19:30 |
| 8:00 PM   | 20:00 |
| 8:30 PM   | 20:30 |
| 9:00 PM   | 21:00 |

### Party size options (`#resGuests`)

`"1 Guest"` … `"6 Guests"` parse to integers `1`–`6`. `"7+ Guests (call us)"`
parses to `partySize: null`, `partySizeLabel: "7+ Guests (call us)"` —
the backend/dashboard should treat `null` as "needs a phone follow-up".

### Occasion options (`#resOccasion`)

`null` (none), `"Birthday"`, `"Anniversary"`, `"Business Dinner"`,
`"Date Night"`, `"Family Gathering"`.

## Expected response

- **Success**: any `2xx` status. Body is currently ignored — if the
  reservation system returns a confirmation ID, update the success branch
  in `js/script.js` to surface it (e.g. in `#formSuccess`).
- **Failure**: any non-`2xx` status or network error triggers `#formError`.
  If the API returns field-level validation errors, the dashboard/API
  contract should be checked against the client-side `required`/`type`
  constraints already enforced (name, email, phone, date, time, guests are
  required; occasion and special requests are optional).

## Auth & CORS

This is a static site (deployed on Vercel, no build step, no server-side
secrets). Two integration shapes are possible depending on the real API:

- **Public, CORS-enabled endpoint**: point `RESERVATION_API_ENDPOINT`
  directly at it. Ensure the API allows `POST` + `Content-Type:
  application/json` from the landing page's origin.
- **Authenticated / same-origin only**: add a small Vercel serverless
  function (e.g. `api/reservations.js`) that proxies to the real backend
  with the required credentials, and point `RESERVATION_API_ENDPOINT` at
  `/api/reservations`. This keeps any API keys out of client-side code.

## Database / workflow / dashboard alignment checklist

When the reservation repo becomes available, confirm:

- [ ] The `reservations` table (or equivalent) has columns matching the
      payload above (`name`, `email`, `phone`, `date`, `time`, `party_size`,
      `occasion`, `special_requests`, `source`), or update
      `buildReservationPayload()` to match the real column names.
- [ ] New reservations created via this endpoint appear in the existing
      dashboard with a "pending/new" status consistent with reservations
      created through other channels (phone, walk-in).
- [ ] The dashboard's reservation workflow (confirmation emails, staff
      notifications, status transitions) is triggered the same way for
      `source: "website"` reservations as for others.
- [ ] `7+ Guests (call us)` (`partySize: null`) is handled gracefully by
      the dashboard/staff workflow rather than causing a validation error.
