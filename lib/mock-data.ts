import { Project, Task, TeamMember, DashboardStats } from '@/types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-02-15',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Develop iOS and Android apps for customer engagement',
    status: 'planning',
    priority: 'medium',
    dueDate: '2024-03-20',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-08',
  },
  {
    id: '3',
    name: 'Database Migration',
    description: 'Migrate legacy database to new cloud infrastructure',
    status: 'completed',
    priority: 'low',
    dueDate: '2024-01-30',
    createdAt: '2023-12-15',
    updatedAt: '2024-01-25',
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design mockups',
    description: 'Create high-fidelity mockups for the new website design',
    status: 'completed',
    priority: 'high',
    projectId: '1',
    assignedTo: 'john@example.com',
    tags: ['design', 'ui/ux'],
    dueDate: '2024-01-20',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-18',
  },
  {
    id: '2',
    title: 'Implement authentication',
    description: 'Set up user authentication and authorization system',
    status: 'in-progress',
    priority: 'high',
    projectId: '1',
    assignedTo: 'jane@example.com',
    tags: ['backend', 'security'],
    dueDate: '2024-02-01',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-15',
  },
  {
    id: '3',
    title: 'Database schema design',
    description: 'Design database schema for mobile app backend',
    status: 'todo',
    priority: 'medium',
    projectId: '2',
    assignedTo: 'mike@example.com',
    tags: ['database', 'planning'],
    dueDate: '2024-02-10',
    createdAt: '2024-01-06',
    updatedAt: '2024-01-06',
  },
  {
    id: '4',
    title: 'API documentation',
    description: 'Write comprehensive API documentation for developers',
    status: 'todo',
    priority: 'low',
    projectId: '2',
    tags: ['documentation'],
    dueDate: '2024-03-01',
    createdAt: '2024-01-07',
    updatedAt: '2024-01-07',
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Frontend Developer',
    avatar: '/avatars/john.jpg',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Backend Developer',
    avatar: '/avatars/jane.jpg',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'Database Administrator',
    avatar: '/avatars/mike.jpg',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalProjects: mockProjects.length,
  totalTasks: mockTasks.length,
  completedTasks: mockTasks.filter(task => task.status === 'completed').length,
  pendingTasks: mockTasks.filter(task => task.status === 'todo').length,
  overdueTasks: mockTasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    return dueDate < today && task.status !== 'completed';
  }).length,
  productivityPercentage:
    mockTasks.length > 0
      ? Math.round((mockTasks.filter(task => task.status === 'completed').length / mockTasks.length) * 100)
      : 0,
};
