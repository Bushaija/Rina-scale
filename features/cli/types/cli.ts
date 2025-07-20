// types/cli.ts
export interface CommandItem {
    name: string;
    description: string;
    example: string;
    category: 'Create' | 'Query' | 'Report' | 'Bulk' | 'Validate' | 'Cleanup' | 'Info' | 'Demo' | 'Help';
  }
  
  export interface CommandSection {
    id: string;
    title: string;
    icon: string;
    commands: CommandItem[];
  }