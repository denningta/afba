// The id our Plaid data is stored under (the `users` collection) and the
// client_user_id Plaid sees. Bank connections belong to the household, not to
// whichever person linked them, so this is the same for every signed-in user.
export const HOUSEHOLD_ID = 'root-user'
