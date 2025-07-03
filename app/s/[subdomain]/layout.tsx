import { getSubdomainData } from '@/lib/subdomains';
import { notFound } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { RegistrySidebar } from '@/components/registry-sidebar';

interface SubdomainLayoutProps {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}



export default async function SubdomainLayout({ children, params }: SubdomainLayoutProps) {
  const { subdomain } = await params;

  if (!subdomain) {
    notFound();
  }

  const subdomainData = await getSubdomainData(subdomain);
  if (!subdomainData) {
    notFound();
  }

  const allComponents = subdomainData.registry || [];

  return (
    <SidebarProvider>
      <RegistrySidebar 
        subdomain={subdomain}
        registryName={subdomainData.name || `${subdomain} Registry`}
        allComponents={allComponents}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
} 