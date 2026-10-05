export type UserRole = 
  | 'Employee'
  | 'Manager'
  | 'HR Executive'
  | 'Payroll Officer'
  | 'HR Admin'
  | 'System Administrator';

export interface User {
  id: string;
  email: string;
  name: string;
  employeeId?: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  designation?: string;
  workLocation?: string;
  engagementCategory?: string;
  password?: string;
}

export interface ERPNextCredentials {
  url: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiSecret?: string;
  connected: boolean;
  useMockFallback: boolean;
  version?: string;
  siteName?: string;
}
