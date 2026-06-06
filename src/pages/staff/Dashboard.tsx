import React from 'react'
import { useAuth } from '../../auth/AuthContext'
import { WhStaffDashboard } from './WhStaffDashboard'
import { TenantStaffDashboard } from './TenantStaffDashboard'

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth()

  if (user?.role === 'WH_STAFF') {
    return <WhStaffDashboard />
  }

  return <TenantStaffDashboard />
}
