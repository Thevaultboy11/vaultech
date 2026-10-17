// Google Calendar API key (no sign-in). An API key can only read calendars that are
// set to PUBLIC in Google Calendar. Restrict this key in Google Cloud Console →
// Credentials: "Websites" (your app's address) + "Google Calendar API" only.
export const GOOGLE_CALENDAR_API_KEY = 'AIzaSyB9ej1ivgXkJWG0sHHHPjrhRUZq8Ek0AYg';

// Calendars added automatically on first launch (you can turn them off or remove them in Settings).
export const BUILT_IN_CALENDARS = [
  { id: 'c_2ac9efb931007fc26375224c1c95e6e4573959335b90ba874f0e83b86ef3f978@group.calendar.google.com', name: 'Shared calendar', color: '#60A5FA' },
  { id: 'dd4017@nyu.edu', name: 'NYU (dd4017)', color: '#A78BFA' },
];
