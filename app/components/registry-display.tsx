import Link from "next/link";
import { rootDomain, protocol } from "@/lib/utils";

interface RegistryDisplayProps {
  subdomain: string;
  subdomainData: {
    name?: string;
    description?: string;
    emoji: string;
    createdAt: number;
    registry: Array<{
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
    }>;
  };
}

function ComponentCard({ 
  component, 
  subdomain 
}: { 
  component: any; 
  subdomain: string;
}) {
  const mainFile = component.files?.find((file: any) => 
    file.type === 'registry:component' || 
    file.type === 'registry:ui' ||
    file.path.includes(component.name)
  );

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'registry:component':
      case 'registry:ui':
        return 'bg-blue-100 text-blue-800';
      case 'registry:hook':
        return 'bg-green-100 text-green-800';
      case 'registry:lib':
      case 'registry:utils':
        return 'bg-purple-100 text-purple-800';
      case 'registry:page':
        return 'bg-orange-100 text-orange-800';
      case 'registry:example':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const truncateContent = (content: string, maxLines: number = 10) => {
    const lines = content.split('\n');
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join('\n') + '\n// ... (truncated)';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link 
              href={`/items/${component.name}`}
              className="text-lg font-semibold hover:text-blue-600 transition-colors"
            >
              {component.name}
            </Link>
            {component.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {component.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {component.type}
              </span>
              <span className="text-xs text-muted-foreground">
                {component.files?.length || 0} files
              </span>
            </div>
          </div>
          <Link 
            href={`/items/${component.name}`}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            View Details →
          </Link>
        </div>
      </div>

      {/* Install Command */}
      <div className="p-4 border-b">
        <div className="bg-muted p-3 rounded font-mono text-sm">
          npx shadcn@latest -r {protocol}://{subdomain}.{rootDomain} add {component.name}
        </div>
      </div>

      {/* Dependencies */}
      {(component.dependencies?.length > 0 || component.registryDependencies?.length > 0) && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-2">Dependencies</h4>
          <div className="flex flex-wrap gap-2">
            {component.dependencies?.map((dep: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800"
              >
                {dep}
              </span>
            ))}
            {component.registryDependencies?.map((dep: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {component.files && component.files.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium mb-3">Files</h4>
          <div className="space-y-3">
            {component.files.map((file: any, fileIndex: number) => (
              <div key={fileIndex} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{file.path}</span>
                    {file.target && (
                      <span className="text-xs text-muted-foreground">
                        → {file.target}
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFileTypeColor(file.type)}`}>
                    {file.type.replace('registry:', '')}
                  </span>
                </div>
                {file.content && (
                  <div className="p-3">
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      <code>{truncateContent(file.content)}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegistryDisplay({
  subdomain,
  subdomainData,
}: RegistryDisplayProps) {
  const componentsCount = subdomainData.registry?.length || 0;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {subdomainData.name || `${subdomain} Registry`}
        </h1>
        <p className="text-muted-foreground">
          {subdomainData.description ||
            `A custom registry for distributing code using shadcn.`}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm text-muted-foreground">
            {componentsCount} component{componentsCount !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-muted-foreground">
            Created {new Date(subdomainData.createdAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      <main className="flex flex-col flex-1 gap-6">
        {subdomainData.registry && subdomainData.registry.length > 0 ? (
          subdomainData.registry.map((component, index) => (
            <ComponentCard
              key={component.name || index}
              component={component}
              subdomain={subdomain}
            />
          ))
        ) : (
          <div className="flex flex-col gap-4 border rounded-lg p-8 text-center">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Components Yet</h3>
              <p className="text-sm text-muted-foreground">
                This registry doesn't have any components yet.
              </p>
            </div>
          </div>
        )}

        {/* API Endpoint Section */}
        <div className="border rounded-lg p-4 mt-8">
          <h2 className="text-lg font-semibold mb-3">Registry Endpoint</h2>
          <div className="bg-muted p-3 rounded font-mono text-sm break-all">
            {protocol}://{subdomain}.{rootDomain}/r
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use this endpoint to fetch the registry JSON in your projects
          </p>
        </div>
      </main>
    </div>
  );
}
