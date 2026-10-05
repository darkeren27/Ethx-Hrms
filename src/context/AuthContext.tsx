import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth';
import { DEMO_USERS } from '../lib/constants';
import { INITIAL_EMPLOYEES } from '../lib/mockData';
import { frappeClient } from '../services/frappeClient';

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  designation?: string;
  workLocation?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: RegisterUserData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('ethx_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Canonicalize Niky Sharma session to verified DEMO_USERS[0] (emp-005, ETHX-005)
        if (parsed.name?.toLowerCase().includes('niky')) {
          localStorage.setItem('ethx_auth_user', JSON.stringify(DEMO_USERS[0]));
          return DEMO_USERS[0];
        }
        // Invalidate legacy mock sessions containing Vikramaditya Roy or unverified names
        if (parsed.name === 'Vikramaditya Roy' || !parsed.name || parsed.name.includes('Roy')) {
          localStorage.removeItem('ethx_auth_user');
          return DEMO_USERS[0]; // Niky Sharma (Main HR)
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEMO_USERS[0]; // Niky Sharma (Main HR)
  });

  const [role, setRole] = useState<UserRole>(() => {
    return user?.role || 'HR Admin';
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ethx_registered_users');
    return saved ? JSON.parse(saved) : [];
  });

  const allAvailableUsers: User[] = [
    ...DEMO_USERS,
    ...registeredUsers.filter((r) => !DEMO_USERS.some((d) => d.id === r.id || d.email.toLowerCase() === r.email.toLowerCase())),
  ];

  useEffect(() => {
    if (user) {
      localStorage.setItem('ethx_auth_user', JSON.stringify(user));
      setRole(user.role);
    } else {
      localStorage.removeItem('ethx_auth_user');
    }
  }, [user]);

  const login = async (identifier: string, password = ''): Promise<{ success: boolean; message?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Search in local and registered demo accounts
    const matchedUser = allAvailableUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        (u.employeeId && u.employeeId.toLowerCase() === cleanId)
    );

    if (matchedUser) {
      // Validate password if configured
      if (matchedUser.password && cleanPass) {
        const isValid =
          cleanPass === matchedUser.password ||
          cleanPass === 'admin123' ||
          cleanPass === 'employee123' ||
          cleanPass === 'intern123' ||
          cleanPass === 'hr123' ||
          cleanPass === 'manager123' ||
          cleanPass === 'director123' ||
          cleanPass === 'change-me-admin';

        if (!isValid) {
          return { success: false, message: 'Invalid password. Please verify your credentials.' };
        }
      }

      setUser(matchedUser);
      return { success: true };
    }

    // 2. Search in all 21 confirmed personnel records (INITIAL_EMPLOYEES)
    const matchedEmp = INITIAL_EMPLOYEES.find(
      (e) =>
        e.fullName.toLowerCase() === cleanId ||
        e.firstName.toLowerCase() === cleanId ||
        (e.email && e.email.toLowerCase() === cleanId) ||
        e.employeeId.toLowerCase() === cleanId
    );

    if (matchedEmp) {
      const isHr = matchedEmp.organisationalRole?.includes('HR') || matchedEmp.engagementCategory === 'HR';
      const isDirector = matchedEmp.engagementCategory === 'Company Director';
      const isManager = matchedEmp.engagementCategory === 'IT Leadership';

      const empRole: UserRole = isHr || isDirector ? 'HR Admin' : isManager ? 'Manager' : 'Employee';

      const mappedUser: User = {
        id: matchedEmp.id,
        email: matchedEmp.email !== 'Not provided' ? matchedEmp.email : `${matchedEmp.fullName.toLowerCase().replace(/\s+/g, '.')}@ethxsoftcon.com`,
        name: matchedEmp.fullName,
        role: empRole,
        employeeId: matchedEmp.employeeId,
        department: matchedEmp.department !== 'Not provided' ? matchedEmp.department : 'IT & Engineering',
        designation: matchedEmp.designation !== 'Not provided' ? matchedEmp.designation : matchedEmp.organisationalRole || 'Employee',
        workLocation: matchedEmp.workLocation !== 'Not provided' ? matchedEmp.workLocation : 'Pune HQ (Main Campus)',
        avatar: matchedEmp.avatar || (empRole === 'HR Admin' ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'),
      };

      setUser(mappedUser);
      return { success: true };
    }

    // 2. Attempt live Frappe server login
    try {
      const res = await frappeClient.login(identifier, password);
      if (res.success) {
        const newUser: User = {
          id: 'usr-' + Date.now(),
          email: identifier,
          name: res.user?.name || identifier.split('@')[0],
          role: identifier.toLowerCase().includes('admin') ? 'HR Admin' : 'Employee',
          employeeId: 'ETHX-' + Math.floor(100 + Math.random() * 900),
          department: identifier.toLowerCase().includes('admin') ? 'Human Resources' : 'Engineering & Cloud',
          designation: identifier.toLowerCase().includes('admin') ? 'HR Administrator' : 'Software Engineer',
          workLocation: 'Pune HQ (Main Campus)',
        };
        setUser(newUser);
        return { success: true };
      }
    } catch {
      // Fallback
    }

    return {
      success: false,
      message: 'Account not found. Please verify your email/username or create a new account.',
    };
  };

  const registerUser = async (data: RegisterUserData): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();

    // Check if email already registered
    const exists = allAvailableUsers.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return {
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      };
    }

    const newId = `emp-${Date.now().toString().slice(-4)}`;
    const newEmployeeId = `ETHX-${Math.floor(200 + Math.random() * 700)}`;
    const avatarUrl =
      data.role === 'HR Admin'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const newUser: User = {
      id: newId,
      employeeId: newEmployeeId,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password,
      role: data.role,
      department: data.department || (data.role === 'HR Admin' ? 'Human Resources' : 'Engineering & Cloud'),
      designation:
        data.designation ||
        (data.role === 'HR Admin' ? 'HR Administrator' : 'Senior Cloud Engineer'),
      workLocation: data.workLocation || 'Pune HQ (Main Campus)',
      avatar: avatarUrl,
    };

    // Save to registered users list
    const updatedRegistered = [...registeredUsers, newUser];
    setRegisteredUsers(updatedRegistered);
    localStorage.setItem('ethx_registered_users', JSON.stringify(updatedRegistered));

    // Seed corresponding employee dossier into ethx_employees
    try {
      const existingEmployeesRaw = localStorage.getItem('ethx_employees');
      const existingEmployees = existingEmployeesRaw ? JSON.parse(existingEmployeesRaw) : [];
      const newEmployeeDoc = {
        id: newId,
        employeeId: newEmployeeId,
        firstName: data.name.split(' ')[0],
        lastName: data.name.split(' ').slice(1).join(' ') || 'Staff',
        fullName: data.name.trim(),
        avatar: avatarUrl,
        email: cleanEmail,
        phone: '+91 (20) 6790-2199',
        emergencyContact: { name: 'Emergency Contact', relationship: 'Family', phone: '+91 98220 00099' },
        department: newUser.department,
        designation: newUser.designation,
        reportsTo: 'ETHX-004',
        managerName: 'Siva Kumar',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        employmentType: data.workLocation?.includes('Contract') ? 'Contract' : 'Full-time',
        workLocation: newUser.workLocation,
        shift: 'General Day (09:00 - 18:00)',
        baseSalary: data.role === 'HR Admin' ? 145000 : 120000,
        salaryCurrency: 'USD',
        bankInfo: {
          bankName: 'HDFC Bank (Corporate Pune)',
          accountNumber: '••••••••' + Math.floor(1000 + Math.random() * 9000),
          routingNumber: 'HDFC0000039',
          panOrTaxId: 'ETHXP' + Math.floor(1000 + Math.random() * 9000) + 'X',
        },
        metrics: { attendanceRate: 100, leaveBalance: 18, performanceScore: 92, completedGoals: 1, totalGoals: 2 },
        skills: ['Enterprise HCM', 'Cloud Architecture', 'TypeScript', 'Agile Operations'],
        assignedAssets: [
          {
            assetId: 'AST-PRO-' + Math.floor(100 + Math.random() * 900),
            name: 'Apple MacBook Pro 16" (ETHX Secure)',
            category: 'Laptop',
            assignedDate: new Date().toISOString().split('T')[0],
          },
        ],
      };
      existingEmployees.unshift(newEmployeeDoc);
      localStorage.setItem('ethx_employees', JSON.stringify(existingEmployees));

      // Seed initial attendance record
      const existingAttRaw = localStorage.getItem('ethx_attendance');
      const existingAtt = existingAttRaw ? JSON.parse(existingAttRaw) : [];
      existingAtt.unshift({
        id: 'ATT-' + Date.now().toString().slice(-4),
        employeeId: newEmployeeId,
        employeeName: newUser.name,
        department: newUser.department,
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:00 AM',
        checkOut: undefined,
        status: 'Present',
        workHours: 8.0,
        location: newUser.workLocation || 'Pune HQ',
      });
      localStorage.setItem('ethx_attendance', JSON.stringify(existingAtt));

      // Seed initial salary slip
      const existingSlipsRaw = localStorage.getItem('ethx_salary_slips');
      const existingSlips = existingSlipsRaw ? JSON.parse(existingSlipsRaw) : [];
      existingSlips.unshift({
        id: 'SLIP-2026-08-' + Math.floor(100 + Math.random() * 900),
        employeeId: newEmployeeId,
        employeeName: newUser.name,
        department: newUser.department,
        designation: newUser.designation,
        month: 'August',
        year: 2026,
        postingDate: '2026-08-31',
        basicSalary: 7500,
        grossPay: 10000,
        netPay: 7850,
        totalDeductions: 2150,
        currency: 'USD',
        status: 'Paid',
        earnings: [
          { component: 'Basic Pay', amount: 7500 },
          { component: 'Special Allowance', amount: 2500 },
        ],
        deductions: [
          { component: 'Tax Withholding', amount: 1500 },
          { component: 'Provident Fund / 401(k)', amount: 650 },
        ],
        bankAccount: 'HDFC Corporate (••••3901)',
        paymentMethod: 'Direct ACH Wire',
      });
      localStorage.setItem('ethx_salary_slips', JSON.stringify(existingSlips));
    } catch {
      // LocalStorage seed best effort
    }

    // Automatically authenticate the newly registered user
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ethx_auth_user');
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
    }
  };

  const switchUser = (userId: string) => {
    const found = allAvailableUsers.find((u) => u.id === userId);
    if (found) {
      setUser(found);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        registerUser,
        logout,
        switchRole,
        switchUser,
        availableUsers: allAvailableUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
