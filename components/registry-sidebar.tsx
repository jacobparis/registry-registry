'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface RegistryItemData {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{
    path: string;
    type: string;
    content?: string;
    target?: string;
  }>;
}

interface RegistrySidebarProps {
  subdomain: string;
  registryName: string;
  allComponents: RegistryItemData[];
}

export function RegistrySidebar({ subdomain, registryName, allComponents }: RegistrySidebarProps) {
  const pathname = usePathname();

  // Group components by type
  const componentsByType = allComponents.reduce((acc, comp) => {
    const type = comp.type.replace('registry:', '');
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(comp);
    return acc;
  }, {} as Record<string, RegistryItemData[]>);

  // Sort types for consistent ordering
  const sortedTypes = Object.keys(componentsByType).sort();

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="p-6">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to registry
          </Link>
          <div>
            <Link
              href="/"
              className="block"
            >
              <h2 className="text-lg font-normal">{registryName}</h2>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{allComponents.length} components</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        {sortedTypes.map((type) => (
          <SidebarGroup key={type} className="mb-6">
            <SidebarGroupLabel className="px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
              {type} ({componentsByType[type].length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {componentsByType[type].map((comp: RegistryItemData) => {
                  const isActive = pathname === `/items/${comp.name}`;
                  
                  return (
                    <SidebarMenuItem key={comp.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg transition-colors",
                          isActive 
                            ? "bg-gray-100 dark:bg-gray-900" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        )}
                      >
                        <Link href={`/items/${comp.name}`}>
                          <div className="flex flex-col items-start w-full">
                            <div className="font-normal">{comp.name}</div>
                            {comp.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 text-left">{comp.description}</div>
                            )}
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
} 