'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { organizationApi, type Organization } from '@/lib/api'
import { useAuth } from './auth-context'
import { toast } from 'sonner'

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  isLoading: boolean
  setOrganization: (orgId: string) => void
  setOrganizationWithoutReload: (orgId: string) => void
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, activeOrganizationId, updateActiveOrganizationId } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([])
      setCurrentOrganization(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await organizationApi.getUserOrganizations()
      const orgs = response.organizations
      setOrganizations(orgs)

      // Lógica de selección basada en el estado del backend (vía AuthContext)
      let selectedOrg = null

      if (activeOrganizationId) {
        selectedOrg = orgs.find(o => o._id === activeOrganizationId)
      }

      // Fallback: usar la primera si no hay activa definida
      if (!selectedOrg && orgs.length > 0) {
        selectedOrg = orgs[0]
      }

      if (selectedOrg) {
        setCurrentOrganization(selectedOrg)
        localStorage.setItem('currentOrgId', selectedOrg._id)
      } else {
        setCurrentOrganization(null)
      }

    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Error al cargar tus espacios de trabajo')
      setOrganizations([])
      setCurrentOrganization(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, activeOrganizationId])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  const setOrganization = async (orgId: string) => {
    const org = organizations.find(o => o._id === orgId)
    if (org) {
      try {
        // Actualizar en backend
        await organizationApi.setActive(org._id)

        // Actualizar en frontend
        updateActiveOrganizationId(org._id)
        setCurrentOrganization(org)
        localStorage.setItem('currentOrgId', org._id)

        toast.success(`Cambiado a ${org.name}`)

        // Recargar para asegurar consistencia total de datos
        window.location.reload()
      } catch (error) {
        console.error('Error switching organization:', error)
        toast.error('Error al cambiar de organización')
      }
    }
  }

  const setOrganizationWithoutReload = async (orgId: string) => {
    const org = organizations.find(o => o._id === orgId)
    if (org) {
      try {
        await organizationApi.setActive(org._id)
        updateActiveOrganizationId(org._id)
        setCurrentOrganization(org)
        toast.success(`Cambiado a ${org.name}`)
      } catch (error) {
        console.error('Error switching organization:', error)
        toast.error('Error al cambiar de organización')
      }
    }
  }

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        isLoading,
        setOrganization,
        setOrganizationWithoutReload,
        refreshOrganizations: loadOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

