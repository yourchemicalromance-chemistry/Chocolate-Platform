# Discovery and Contact Lock security notes

## Server secret

Set `CONTACT_LOCK_HMAC_SECRET` only in the backend environment. Generate at least 32 random bytes, for example with `openssl rand -base64 48`. The service validates the value during module startup and refuses startup for missing, short, repeated, or known placeholder values. Do not add it to Expo configuration or frontend environment variables.

Contact matching stores only keyed digests. Because original contact values are intentionally not retained, rotating `CONTACT_LOCK_HMAC_SECRET` invalidates all existing contact digests. Before rotation, plan to ask every Contact Lock user to synchronize their contacts again. A rolling deployment with two keys is not implemented; do not rotate one instance at a time.

Phone inputs are tagged with India (`phone[IN]:...`) because Expo Contacts does not provide reliable per-number region metadata in this app. Explicit international prefixes are honored by libphonenumber-js; national-format numbers use `IN`, matching the existing signup phone-number strategy. Valid values are canonicalized to E.164. Legacy-format aliases are also generated during matching and synchronization so existing hashes continue to match through the transition; these aliases can be removed only after all users have synchronized using the new format.

## Discovery limits and location output

Discovery feed, match and saved-profile pages are limited to 30 profiles and ten pages. The authenticated discovery guard uses Redis counters and a daily cap of four distinct origin cells. Nearby and manual-search origins are rounded to a 0.01 degree grid (about 1 km latitude) before persistence and use. Legacy saved origins are rounded when read, including for Area Exclusion and Neighbourhood Lock checks, so tiny coordinate changes cannot move an origin or create different access decisions. Area Exclusion fails closed when no rounded viewer origin exists. This adds roughly sub-kilometre search-origin uncertainty while retaining the existing radius choices. Redis failures fail closed. Profile responses contain only broad distance bands and no caller-supplied area label or exact coordinates.

## Prisma custom SQL objects

`20261120100000_discovery_privacy` creates GiST indexes on the PostGIS geography columns and radius `CHECK` constraints. Prisma's current schema does not declare those custom indexes or checks; retain them in the migration history and verify them in the database when migrations are reviewed. No migration was applied as part of this source change.

## Blocking

There is no existing block model or block endpoint. Blocking is not implemented by `PASS` and must be designed as a separate product feature before it can be enforced in discovery.
