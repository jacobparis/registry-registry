import { NewRegistryForm } from '@/components/new-registry-form';

export default async function HomePage() {
 
  // If we're on the root domain, show the form to create a new registry
  return <NewRegistryForm />;
}
