Add a user-controlled display name that overrides the email-derived nickname on the home dashboard.

### Changes

1. **Database**
   - Create a `public.profiles` table with `user_id`, `display_name`, and timestamps.
   - RLS: authenticated users can read/update only their own row.

2. **Data layer**
   - Add a `useProfile` hook that fetches the profile on mount and provides an `updateDisplayName` function.

3. **Dashboard greeting**
   - In `src/pages/Dashboard.tsx`, load the profile and use `display_name` when present; otherwise fall back to the 4–10 character nickname derived from the email.

4. **Settings UI**
   - Extend the Settings section in the sidebar to expose a "Display name" input field.
   - Save on blur or explicit confirmation, and show a toast on success/error.

### Result
The user will be able to set a custom greeting name (e.g., "Alex" or "Boss") from the sidebar Settings, and the dashboard will greet them with that name instead of the email-derived nickname.