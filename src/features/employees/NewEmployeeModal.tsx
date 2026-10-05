import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { hrmsService } from '../../services/hrmsService';
import { Employee } from '../../types/hrms';

interface NewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmployee: Employee) => void;
}

export const NewEmployeeModal: React.FC<NewEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering & Cloud',
    designation: 'Cloud ERP Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-time' as const,
    workLocation: 'Pune HQ (Main Campus)',
    baseSalary: 125000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await hrmsService.createEmployee({
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`,
        status: 'Active',
        employeeId: `ETHX-0${Math.floor(Math.random() * 80 + 20)}`,
        metrics: { attendanceRate: 100, leaveBalance: 18, performanceScore: 90, completedGoals: 0, totalGoals: 3 },
        skills: ['TypeScript', 'Frappe', 'REST APIs'],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      onSuccess(created);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Onboard New Employee" subtitle="Creates record in ERPNext Employee DocType" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Jane"
          />
          <Input
            label="Last Name"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="jane.doe@ethxsoftcon.com"
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (415) 555-0199"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Department"
            options={[
              { value: 'Engineering & Cloud', label: 'Engineering & Cloud' },
              { value: 'Human Resources & Talent', label: 'Human Resources & Talent' },
              { value: 'Finance & Payroll', label: 'Finance & Payroll' },
              { value: 'Enterprise Sales & Growth', label: 'Enterprise Sales & Growth' },
            ]}
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Designation"
            required
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Joining Date"
            type="date"
            required
            value={formData.joiningDate}
            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
          />
          <Select
            label="Work Modality"
            options={[
              { value: 'Pune HQ (Main Campus)', label: '🏢 Pune HQ (Main Campus)' },
              { value: 'Contract WFH (Pan-India)', label: '💻 Contract WFH (Pan-India)' },
            ]}
            value={formData.workLocation}
            onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
          />
          <Input
            label="Annual Compensation (USD)"
            type="number"
            required
            value={formData.baseSalary}
            onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
          />
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Create Employee Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
