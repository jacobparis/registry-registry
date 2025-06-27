'use client';

import Link from "next/link";
import React, { useState } from "react";
import { rootDomain, protocol, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, ArrowLeft, Plus, X } from "lucide-react";
import { updateComponentAction } from "@/app/actions";

interface RegistryItemFile {
  path: string;
  type: string;
  content?: string;
  target?: string;
}

interface RegistryItemData {
  $schema?: string;
  name: string;
  title?: string;
  description?: string;
  type: string;
  author?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryItemFile[];
  tailwind?: {
    config?: any;
  };
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: Record<string, any>;
  docs?: string;
  categories?: string[];
  meta?: Record<string, any>;
}

interface ComponentDetailProps {
  component: RegistryItemData;
  subdomain: string;
  registryData: {
    name?: string;
    description?: string;
    emoji: string;
    createdAt: number;
  };
}

const REGISTRY_TYPES = [
  'registry:block',
  'registry:component', 
  'registry:lib',
  'registry:hook',
  'registry:ui',
  'registry:page',
  'registry:file',
  'registry:style',
  'registry:theme'
];

const FILE_TYPES = [
  'registry:component',
  'registry:ui',
  'registry:hook',
  'registry:lib',
  'registry:page',
  'registry:file',
  'registry:style',
  'registry:theme',
  'registry:example'
];

function InlineInput({
  value, onChange, placeholder = "Click to edit", className = "", onSave, ...props
}: {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
} & Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      onBlur={() => {
        const currentValue = inputRef.current?.value || '';
        if (currentValue !== value) {
          onChange(currentValue);
          onSave?.();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          if (inputRef.current) {
            inputRef.current.value = value;
          }
          e.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      className={`
        w-full
        py-2 px-4 
        bg-muted/50 sm:text-sm
        border-none 
        outline-none 
        ring-0
        transition-all
        duration-200
        placeholder:text-muted-foreground
        hover:bg-muted rounded-sm
        hover:border hover:border-border focus:ring-2 focus:ring-ring focus:rounded-md focus:shadow-sm
        ${!value ? 'text-muted-foreground' : ''}
        ${className}
      `}
      {...props}
    />
  );
}

function InlineSelect({
  value, onChange, options, className = "", onSave
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  onSave?: () => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        onChange(newValue);
        onSave?.();
      }}
    >
      <SelectTrigger className={cn("border-none shadow-none bg-transparent py-0 h-auto font-medium", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InlineTextarea({
  value, onChange, className = "", onSave, ...props
}: {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
} & Omit<React.ComponentProps<'textarea'>, 'value' | 'onChange'>) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  return (
    <textarea
      ref={textareaRef}
      defaultValue={value}
      onBlur={(event) => {
        const currentValue = event.currentTarget.value;
        if (currentValue !== value) {
          onChange(currentValue);
          onSave?.();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.value = value;
          event.currentTarget.blur();
        } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
          event.currentTarget.blur();
        }
      }}
      className={cn(`
        w-full px-4 py-2
        bg-muted/50 sm:text-sm
        border-none 
        outline-none 
        ring-0
        resize-none
        transition-all
        duration-200  
        placeholder:text-muted-foreground
        hover:bg-muted hover:rounded-sm
        focus:bg-background focus:border focus:border-input focus:ring-2 focus:ring-ring focus:rounded-md focus:shadow-sm
        min-h-[4rem] h-auto`,
        !value ? 'text-muted-foreground' : '',
        className
      )}
      rows={1}
      {...props}
    />
  );
}

export function ComponentDetail({ component: initialComponent, subdomain, registryData }: ComponentDetailProps) {
  const [component, setComponent] = useState<RegistryItemData>(initialComponent);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const saveComponent = async () => {
    setIsSaving(true);
    try {
      const result = await updateComponentAction(subdomain, component.name, component);
      
      if (!result.success) {
        console.error('Failed to save component:', result.error);
      }
    } catch (error) {
      console.error('Error saving component:', error);
    } finally {
      setIsSaving(false);
    }
  };



  const addDependency = (type: 'dependencies' | 'registryDependencies') => {
    setComponent(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), '']
    }));
  };

  const removeDependency = (type: 'dependencies' | 'registryDependencies', index: number) => {
    setComponent(prev => ({
      ...prev,
      [type]: prev[type]?.filter((_, i) => i !== index) || []
    }));
  };

  const updateDependency = (type: 'dependencies' | 'registryDependencies', index: number, value: string) => {
    setComponent(prev => ({
      ...prev,
      [type]: prev[type]?.map((dep, i) => i === index ? value : dep) || []
    }));
  };

  const addFile = () => {
    setComponent(prev => ({
      ...prev,
      files: [...(prev.files || []), { path: '', type: 'registry:component' }]
    }));
  };

  const removeFile = (index: number) => {
    setComponent(prev => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index) || []
    }));
  };

  const updateFile = (index: number, field: keyof RegistryItemFile, value: string) => {
    setComponent(prev => ({
      ...prev,
      files: prev.files?.map((file, i) => i === index ? { ...file, [field]: value } : file) || []
    }));
  };

  const addCategory = () => {
    setComponent(prev => ({
      ...prev,
      categories: [...(prev.categories || []), '']
    }));
  };

  const removeCategory = (index: number) => {
    setComponent(prev => ({
      ...prev,
      categories: prev.categories?.filter((_, i) => i !== index) || []
    }));
  };

  const updateCategory = (index: number, value: string) => {
    setComponent(prev => ({
      ...prev,
      categories: prev.categories?.map((cat, i) => i === index ? value : cat) || []
    }));
  };

  const updateCssVar = (section: 'theme' | 'light' | 'dark', key: string, value: string) => {
    setComponent(prev => ({
      ...prev,
      cssVars: {
        ...prev.cssVars,
        [section]: {
          ...prev.cssVars?.[section],
          [key]: value
        }
      }
    }));
  };

  const addCssVar = (section: 'theme' | 'light' | 'dark') => {
    const key = prompt('Enter CSS variable name:');
    if (key) {
      updateCssVar(section, key, '');
    }
  };

  const removeCssVar = (section: 'theme' | 'light' | 'dark', key: string) => {
    setComponent(prev => {
      const newCssVars = { ...prev.cssVars };
      if (newCssVars[section]) {
        delete newCssVars[section][key];
      }
      return { ...prev, cssVars: newCssVars };
    });
  };

  const installCommand = `npx shadcn@latest add ${protocol}://${subdomain}.${rootDomain}/r/${component.name}`;


  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Registry
            </Link>
            <div className="text-sm text-muted-foreground">
              {registryData.name || `${subdomain} Registry`} / {component.name}
            </div>
          </div>

        </div>

        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="space-y-6">
                  <div>
                    <InlineInput
                      value={component.name}
                      onChange={(value: string) => setComponent(prev => ({ ...prev, name: value }))}
                      placeholder="Click to edit component name"
                      className="font-medium text-lg tracking-tight h-10"
                      onSave={saveComponent}
                    />
                    <div className="flex items-center gap-3 h-8">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-muted text-muted-foreground border-border">
                        <InlineSelect
                          value={component.type}
                          onChange={(value: string) => setComponent(prev => ({ ...prev, type: value }))}
                          options={REGISTRY_TYPES}
                          className="text-sm font-medium bg-transparent border-none outline-none p-0 m-0 cursor-pointer"
                          onSave={saveComponent}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {component.files?.length || 0} files
                      </span>
                    </div>
                  </div>

                  <div>
                    <InlineTextarea
                      value={component.description || ''}
                      onChange={(value: string) => setComponent(prev => ({ ...prev, description: value }))}
                      placeholder="description"
                      className="bg-muted/50"
                      onSave={saveComponent}
                    />
                  </div>
                  
                  <div className="flex gap-x-4">
                    <InlineInput
                      value={component.author || ''}
                      onChange={(value: string) => setComponent(prev => ({ ...prev, author: value }))}
                      placeholder="author"
                      className="bg-muted/50"
                      onSave={saveComponent}
                    />
                    
                    <InlineInput
                      value={component.docs || ''}
                      onChange={(value: string) => setComponent(prev => ({ ...prev, docs: value }))}
                      placeholder="docs"
                      className="bg-muted/50"
                      onSave={saveComponent}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Install Command */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Installation</CardTitle>
            <CardDescription>
              Add this component to your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted p-3 rounded font-mono text-sm">
                {installCommand}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(installCommand, 'install')}
              >
                {copiedText === 'install' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dependencies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Dependencies</CardTitle>
            <CardDescription>
              Required packages and components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">NPM Dependencies</h4>
              <div className="space-y-2">
                {component.dependencies?.map((dep, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <InlineInput
                      value={dep}
                      onChange={(value) => updateDependency('dependencies', index, value)}
                      placeholder="@radix-ui/react-accordion"
                      className="bg-muted/50 flex-1"
                      onSave={saveComponent}
                    />
                    <Button variant="outline" size="sm" onClick={() => removeDependency('dependencies', index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addDependency('dependencies')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add NPM Dependency
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Registry Dependencies</h4>
              <div className="space-y-2">
                {component.registryDependencies?.map((dep, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <InlineInput
                      value={dep}
                      onChange={(value) => updateDependency('registryDependencies', index, value)}
                      placeholder="button"
                      className="bg-muted/50 flex-1"
                      onSave={saveComponent}
                    />
                    <Button variant="outline" size="sm" onClick={() => removeDependency('registryDependencies', index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => addDependency('registryDependencies')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Registry Dependency
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
            <CardDescription>
              Component organization categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {component.categories?.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <InlineInput
                    value={category}
                    onChange={(value) => updateCategory(index, value)}
                    placeholder="category name"
                    className="bg-muted/50 flex-1"
                    onSave={saveComponent}
                  />
                  <Button variant="outline" size="sm" onClick={() => removeCategory(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Files</CardTitle>
            <CardDescription>
              Source code and implementation files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {component.files?.map((file, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">File {index + 1}</h5>
                    <Button variant="outline" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <InlineInput
                      value={file.path}
                      onChange={(value) => updateFile(index, 'path', value)}
                      placeholder="file path"
                      className="bg-muted/50"
                      onSave={saveComponent}
                    />
                    <InlineSelect
                      value={file.type}
                      onChange={(value) => updateFile(index, 'type', value)}
                      options={FILE_TYPES}
                      className="bg-muted/50"
                      onSave={saveComponent}
                    />
                  </div>

                  {(file.type === 'registry:page' || file.type === 'registry:file') && (
                    <InlineInput
                      value={file.target || ''}
                      onChange={(value) => updateFile(index, 'target', value)}
                      placeholder="target path"
                      className="bg-muted/50"
                      onSave={saveComponent}
                    />
                  )}

                  <InlineTextarea
                    value={file.content || ''}
                    onChange={(value) => updateFile(index, 'content', value)}
                    placeholder="file content"
                    className="bg-muted/50 font-mono text-sm min-h-[200px]"
                    onSave={saveComponent}
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFile}>
                <Plus className="h-4 w-4 mr-2" />
                Add File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 