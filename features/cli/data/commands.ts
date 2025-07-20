import { CommandSection } from "../types/cli";

export const commandSections: CommandSection[] = [
    {
      id: 'projects',
      title: 'Project Management',
      icon: '🏗️',
      commands: [
        {
          name: 'project:create',
          description: 'Create a new healthcare project',
          example: 'pnpm db:cli project:create -n "HIV Program 2024" -c "HIV2024" -t "HIV"',
          category: 'Create',
        },
        {
          name: 'project:list',
          description: 'List all projects with optional filters',
          example: 'pnpm db:cli project:list -s ACTIVE -t HIV',
          category: 'Query',
        },
        {
          name: 'project:get',
          description: 'Get detailed project information',
          example: 'pnpm db:cli project:get -i 1',
          category: 'Query',
        },
      ],
    },
    {
      id: 'facilities',
      title: 'Facility Management',
      icon: '🏥',
      commands: [
        {
          name: 'facility:create',
          description: 'Register a new healthcare facility',
          example: 'pnpm db:cli facility:create -n "Central Hospital" -t "hospital" -d 1',
          category: 'Create',
        },
        {
          name: 'facility:list',
          description: 'List all facilities by type or district',
          example: 'pnpm db:cli facility:list -t hospital -d 1',
          category: 'Query',
        },
      ],
    },
    {
      id: 'planning',
      title: 'Planning Data',
      icon: '📊',
      commands: [
        {
          name: 'planning:create',
          description: 'Create quarterly planning data',
          example: 'pnpm db:cli planning:create -a 1 -f 1 -r 1 -p 1 --frequency "12" --unit-cost "75000" --q1 1',
          category: 'Create',
        },
        {
          name: 'planning:list',
          description: 'View planning data for facility and period',
          example: 'pnpm db:cli planning:list -f 1 -r 1 -p 1',
          category: 'Query',
        },
      ],
    },
    {
      id: 'execution',
      title: 'Execution Data',
      icon: '📈',
      commands: [
        {
          name: 'execution:create',
          description: 'Record quarterly execution amounts',
          example: 'pnpm db:cli execution:create -f 1 -p 1 -a 1 --q1 "225000" --q2 "225000"',
          category: 'Create',
        },
        {
          name: 'execution:list',
          description: 'View execution data for analysis',
          example: 'pnpm db:cli execution:list -f 1 -r 1 -p 1',
          category: 'Query',
        },
      ],
    },
    {
      id: 'reporting',
      title: 'Reports & Analytics',
      icon: '📋',
      commands: [
        {
          name: 'report:planning-vs-execution',
          description: 'Compare planned vs actual execution',
          example: 'pnpm db:cli report:planning-vs-execution -f 1 -r 1 -p 1',
          category: 'Report',
        },
        {
          name: 'report:facility-performance',
          description: 'Generate facility performance summary',
          example: 'pnpm db:cli report:facility-performance -f 1 -r 1',
          category: 'Report',
        },
      ],
    },
    {
      id: 'bulk',
      title: 'Bulk Operations',
      icon: '🔄',
      commands: [
        {
          name: 'bulk:create-planning',
          description: 'Create planning data for multiple facilities',
          example: 'pnpm db:cli bulk:create-planning -f "1,2,3" -r 1 -p 1 -c "HR"',
          category: 'Bulk',
        },
      ],
    },
    {
      id: 'validation',
      title: 'Validation & Utilities',
      icon: '🔧',
      commands: [
        {
          name: 'validate:integrity',
          description: 'Check data integrity and consistency',
          example: 'pnpm db:cli validate:integrity',
          category: 'Validate',
        },
        {
          name: 'validate:cleanup',
          description: 'Remove orphaned and duplicate data',
          example: 'pnpm db:cli validate:cleanup',
          category: 'Cleanup',
        },
        {
          name: 'stats',
          description: 'Display database statistics',
          example: 'pnpm db:cli stats',
          category: 'Info',
        },
      ],
    },
    {
      id: 'examples',
      title: 'Examples & Learning',
      icon: '🚀',
      commands: [
        {
          name: 'examples:run',
          description: 'Run comprehensive usage examples',
          example: 'pnpm db:cli examples:run',
          category: 'Demo',
        },
        {
          name: 'examples:projects',
          description: 'Run project-specific examples',
          example: 'pnpm db:cli examples:projects',
          category: 'Demo',
        },
        {
          name: 'help:examples',
          description: 'Show detailed usage examples',
          example: 'pnpm db:cli help:examples',
          category: 'Help',
        },
      ],
    },
  ];

  export const quickActions = [
    { name: '📊 Database Stats', command: 'pnpm db:cli stats' },
    { name: '🏗️ List Projects', command: 'pnpm db:cli project:list' },
    { name: '🏥 List Facilities', command: 'pnpm db:cli facility:list' },
    { name: '🔍 Validate Data', command: 'pnpm db:cli validate:integrity' },
    { name: '🚀 Run Examples', command: 'pnpm db:cli examples:run' },
    { name: '📚 View Help', command: 'pnpm db:cli help:examples' },
  ];