import { Redirect } from 'expo-router';

export default function Index() {
  // Always land on the login screen
  return <Redirect href="/login" />;
}
