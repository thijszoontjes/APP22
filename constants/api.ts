// Vast endpoint voor de gebruikersservice in productie.
// Met EXPO_PUBLIC_API_URL kun je dit eventueel overschrijven voor testen.
export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://userservice-userservice-projectgroup1-prod.apps.inholland-minor.openshift.eu";
