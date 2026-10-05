import { ERPNextCredentials } from '../types/auth';
import {
  INITIAL_EMPLOYEES,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_APPLICATIONS,
  INITIAL_SALARY_SLIPS,
  INITIAL_JOB_OPENINGS,
  INITIAL_JOB_APPLICANTS,
  INITIAL_GOALS,
  INITIAL_SKILLS,
  INITIAL_ASSETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_INTERNSHIP_LIFECYCLES,
  INITIAL_INTERN_EVALUATIONS,
  INITIAL_MANAGEMENT_DECISIONS,
  INITIAL_EMPLOYMENT_OFFERS,
} from '../lib/mockData';

const memoryStore: Record<string, string> = {};
const safeStorage = {
  getItem: (k: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : (memoryStore[k] || null)),
  setItem: (k: string, v: string) => (typeof localStorage !== 'undefined' ? localStorage.setItem(k, v) : (memoryStore[k] = v)),
  removeItem: (k: string) => (typeof localStorage !== 'undefined' ? localStorage.removeItem(k) : delete memoryStore[k]),
};

class FrappeClient {
  private baseUrl: string = '';
  private isConnected: boolean = false;
  private useMockFallback: boolean = true;
  private currentUser: any = null;

  constructor() {
    const env = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
    this.baseUrl = env.VITE_FRAPPE_URL || 'http://45.195.159.86:8280';
    this.useMockFallback = env.VITE_USE_MOCK_FALLBACK !== 'false';
    this.initLocalStorageMock();
  }

  private initLocalStorageMock() {
    // Idempotent Roster Migration Check
    const MIGRATION_KEY = 'ethx_roster_migration_v10';
    const isMigrated = safeStorage.getItem(MIGRATION_KEY) === 'true';
    const existingEmployees = safeStorage.getItem('ethx_employees');
    const existingAttendance = safeStorage.getItem('ethx_attendance');
    const existingAssets = safeStorage.getItem('ethx_assets');
    const existingSkills = safeStorage.getItem('ethx_skills');
    const attendanceCount = existingAttendance ? (JSON.parse(existingAttendance) || []).length : 0;
    const assetCount = existingAssets ? (JSON.parse(existingAssets) || []).length : 0;
    const skillCount = existingSkills ? (JSON.parse(existingSkills) || []).length : 0;

    if (!isMigrated || !existingEmployees || JSON.parse(existingEmployees).length !== 21 || attendanceCount < 21 || assetCount < 20 || skillCount < 10) {
      safeStorage.setItem('ethx_employees', JSON.stringify(INITIAL_EMPLOYEES));
      safeStorage.setItem('ethx_departments', JSON.stringify(INITIAL_DEPARTMENTS));
      safeStorage.setItem('ethx_designations', JSON.stringify(INITIAL_DESIGNATIONS));
      safeStorage.setItem('ethx_attendance', JSON.stringify(INITIAL_ATTENDANCE));
      safeStorage.setItem('ethx_leave_applications', JSON.stringify(INITIAL_LEAVE_APPLICATIONS));
      safeStorage.setItem('ethx_salary_slips', JSON.stringify(INITIAL_SALARY_SLIPS));
      safeStorage.setItem('ethx_jobs', JSON.stringify(INITIAL_JOB_OPENINGS));
      safeStorage.setItem('ethx_applicants', JSON.stringify(INITIAL_JOB_APPLICANTS));
      safeStorage.setItem('ethx_goals', JSON.stringify(INITIAL_GOALS));
      safeStorage.setItem('ethx_skills', JSON.stringify(INITIAL_SKILLS));
      safeStorage.setItem('ethx_assets', JSON.stringify(INITIAL_ASSETS));
      safeStorage.setItem('ethx_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
      safeStorage.setItem('ethx_internship_lifecycles', JSON.stringify(INITIAL_INTERNSHIP_LIFECYCLES));
      safeStorage.setItem('ethx_intern_evaluations', JSON.stringify(INITIAL_INTERN_EVALUATIONS));
      safeStorage.setItem('ethx_management_decisions', JSON.stringify(INITIAL_MANAGEMENT_DECISIONS));
      safeStorage.setItem('ethx_employment_offers', JSON.stringify(INITIAL_EMPLOYMENT_OFFERS));
      safeStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    if (!safeStorage.getItem('ethx_internship_lifecycles')) {
      safeStorage.setItem('ethx_internship_lifecycles', JSON.stringify(INITIAL_INTERNSHIP_LIFECYCLES));
    }
    if (!safeStorage.getItem('ethx_intern_evaluations')) {
      safeStorage.setItem('ethx_intern_evaluations', JSON.stringify(INITIAL_INTERN_EVALUATIONS));
    }
    if (!safeStorage.getItem('ethx_management_decisions')) {
      safeStorage.setItem('ethx_management_decisions', JSON.stringify(INITIAL_MANAGEMENT_DECISIONS));
    }
    if (!safeStorage.getItem('ethx_employment_offers')) {
      safeStorage.setItem('ethx_employment_offers', JSON.stringify(INITIAL_EMPLOYMENT_OFFERS));
    }
  }

  public setConfig(config: Partial<ERPNextCredentials>) {
    if (config.url) this.baseUrl = config.url;
    if (config.useMockFallback !== undefined) this.useMockFallback = config.useMockFallback;
  }

  public getStatus() {
    return {
      baseUrl: this.baseUrl,
      isConnected: this.isConnected,
      useMockFallback: this.useMockFallback,
      user: this.currentUser,
    };
  }

  public async login(usr: string, pwd: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const res = await fetch('/api/method/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ usr, pwd }),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        this.isConnected = true;
        this.currentUser = {
          email: usr,
          name: data.full_name || usr,
          role: usr.toLowerCase() === 'administrator' ? 'HR Admin' : 'Employee',
        };
        return { success: true, message: 'Logged in to live ERPNext server successfully', user: this.currentUser };
      }
    } catch (err) {
      console.warn('Live ERPNext connection failed, utilizing high-fidelity mock engine', err);
    }

    // Fallback: If live server doesn't respond or credentials match demo
    if (this.useMockFallback) {
      this.isConnected = false;
      this.currentUser = {
        email: usr,
        name: usr.includes('admin') || usr.includes('niky') ? 'Niky Sharma' : 'Krishna Tiwari',
        role: usr.includes('admin') || usr.includes('niky') ? 'HR Admin' : 'Employee',
      };
      return { success: true, message: 'Connected in Enterprise Demo mode', user: this.currentUser };
    }

    return { success: false, message: 'Failed to authenticate with ERPNext' };
  }

  public async getList<T = any>(doctype: string, params: {
    fields?: string[];
    filters?: any[];
    limit?: number;
    order_by?: string;
  } = {}): Promise<T[]> {
    if (this.isConnected) {
      try {
        const query = new URLSearchParams();
        if (params.fields) query.append('fields', JSON.stringify(params.fields));
        if (params.filters) query.append('filters', JSON.stringify(params.filters));
        if (params.limit) query.append('limit_page_length', String(params.limit));
        if (params.order_by) query.append('order_by', params.order_by);

        const res = await fetch(`/api/resource/${doctype}?${query.toString()}`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            return json.data as T[];
          }
        }
      } catch (e) {
        console.warn(`Error fetching ${doctype} from live ERPNext:`, e);
      }
    }

    // Return mock data for the doctype
    return this.getMockList<T>(doctype, params);
  }

  public async getDoc<T = any>(doctype: string, name: string): Promise<T | null> {
    if (this.isConnected) {
      try {
        const res = await fetch(`/api/resource/${doctype}/${encodeURIComponent(name)}`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          const json = await res.json();
          return json.data as T;
        }
      } catch (e) {
        console.warn(`Error fetching ${doctype}/${name} from live ERPNext:`, e);
      }
    }

    return this.getMockDoc<T>(doctype, name);
  }

  public async createDoc<T = any>(doctype: string, data: any): Promise<T> {
    if (this.isConnected) {
      try {
        const res = await fetch(`/api/resource/${doctype}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const json = await res.json();
          return json.data as T;
        }
      } catch (e) {
        console.warn(`Error creating ${doctype} in live ERPNext:`, e);
      }
    }

    return this.createMockDoc<T>(doctype, data);
  }

  public async updateDoc<T = any>(doctype: string, name: string, data: any): Promise<T> {
    if (this.isConnected) {
      try {
        const res = await fetch(`/api/resource/${doctype}/${encodeURIComponent(name)}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const json = await res.json();
          return json.data as T;
        }
      } catch (e) {
        console.warn(`Error updating ${doctype}/${name} in live ERPNext:`, e);
      }
    }

    return this.updateMockDoc<T>(doctype, name, data);
  }

  public async deleteDoc(doctype: string, name: string): Promise<boolean> {
    const key = this.getStorageKey(doctype);
    const list = this.getMockList<any>(doctype, {});
    const filtered = list.filter((item: any) => item.id !== name && item.name !== name);
    safeStorage.setItem(key, JSON.stringify(filtered));
    return true;
  }

  // --- Mock Data Storage Helpers ---
  private getStorageKey(doctype: string): string {
    const map: Record<string, string> = {
      'Employee': 'ethx_employees',
      'Department': 'ethx_departments',
      'Designation': 'ethx_designations',
      'Attendance': 'ethx_attendance',
      'Leave Application': 'ethx_leave_applications',
      'Salary Slip': 'ethx_salary_slips',
      'Job Opening': 'ethx_jobs',
      'Job Applicant': 'ethx_applicants',
      'Goal': 'ethx_goals',
      'Skill Matrix': 'ethx_skills',
      'Asset': 'ethx_assets',
      'Notification': 'ethx_notifications',
      'Internship Lifecycle': 'ethx_internship_lifecycles',
      'Intern Evaluation': 'ethx_intern_evaluations',
      'Management Decision': 'ethx_management_decisions',
      'Employment Offer': 'ethx_employment_offers',
    };
    return map[doctype] || `ethx_${doctype.toLowerCase()}`;
  }

  private getMockList<T>(doctype: string, _params: any): T[] {
    const key = this.getStorageKey(doctype);
    const raw = safeStorage.getItem(key);
    if (!raw) {
      if (doctype === 'Attendance') {
        safeStorage.setItem(key, JSON.stringify(INITIAL_ATTENDANCE));
        return INITIAL_ATTENDANCE as unknown as T[];
      }
      if (doctype === 'Job Opening') {
        safeStorage.setItem(key, JSON.stringify(INITIAL_JOB_OPENINGS));
        return INITIAL_JOB_OPENINGS as unknown as T[];
      }
      if (doctype === 'Job Applicant') {
        safeStorage.setItem(key, JSON.stringify(INITIAL_JOB_APPLICANTS));
        return INITIAL_JOB_APPLICANTS as unknown as T[];
      }
      return [];
    }
    try {
      const parsed = JSON.parse(raw) as T[];
      if (doctype === 'Attendance' && (!Array.isArray(parsed) || parsed.length < 21)) {
        safeStorage.setItem(key, JSON.stringify(INITIAL_ATTENDANCE));
        return INITIAL_ATTENDANCE as unknown as T[];
      }
      if (doctype === 'Job Opening' && (!Array.isArray(parsed) || parsed.length === 0)) {
        safeStorage.setItem(key, JSON.stringify(INITIAL_JOB_OPENINGS));
        return INITIAL_JOB_OPENINGS as unknown as T[];
      }
      if (doctype === 'Job Applicant') {
        const hasPpo = Array.isArray(parsed) && parsed.some((p: any) => p.candidateType === 'Intern PPO');
        if (!Array.isArray(parsed) || parsed.length === 0 || !hasPpo) {
          safeStorage.setItem(key, JSON.stringify(INITIAL_JOB_APPLICANTS));
          return INITIAL_JOB_APPLICANTS as unknown as T[];
        }
      }
      return parsed;
    } catch {
      if (doctype === 'Attendance') {
        safeStorage.setItem(key, JSON.stringify(INITIAL_ATTENDANCE));
        return INITIAL_ATTENDANCE as unknown as T[];
      }
      if (doctype === 'Job Opening') {
        safeStorage.setItem(key, JSON.stringify(INITIAL_JOB_OPENINGS));
        return INITIAL_JOB_OPENINGS as unknown as T[];
      }
      if (doctype === 'Job Applicant') {
        safeStorage.setItem(key, JSON.stringify(INITIAL_JOB_APPLICANTS));
        return INITIAL_JOB_APPLICANTS as unknown as T[];
      }
      return [];
    }
  }

  private getMockDoc<T>(doctype: string, name: string): T | null {
    const list = this.getMockList<any>(doctype, {});
    const doc = list.find((item: any) => item.id === name || item.name === name || item.employeeId === name);
    return (doc as T) || null;
  }

  private createMockDoc<T>(doctype: string, data: any): T {
    const key = this.getStorageKey(doctype);
    const list = this.getMockList<any>(doctype, {});
    const uniqueSuffix = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newDoc = {
      ...data,
      id: data.id || `${doctype.substring(0, 3).toUpperCase()}-${uniqueSuffix}`,
      creation: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
    list.unshift(newDoc);
    safeStorage.setItem(key, JSON.stringify(list));
    return newDoc as T;
  }

  private updateMockDoc<T>(doctype: string, name: string, data: any): T {
    const key = this.getStorageKey(doctype);
    const list = this.getMockList<any>(doctype, {});
    const index = list.findIndex(
      (item: any) =>
        item.id === name ||
        item.name === name ||
        (doctype === 'Employee' && item.employeeId === name)
    );
    if (index !== -1) {
      list[index] = { ...list[index], ...data, modified: new Date().toISOString() };
      safeStorage.setItem(key, JSON.stringify(list));
      return list[index] as T;
    }
    return data as T;
  }
}

export const frappeClient = new FrappeClient();
