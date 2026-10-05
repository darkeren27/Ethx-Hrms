import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessRestricted } from '../ui/AccessRestricted';

interface RoleRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
  customMessage?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  children,
  customMessage,
}) => {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <AccessRestricted allowedRoles={allowedRoles} customMessage={customMessage} />;
  }

  return <>{children}</>;
};
