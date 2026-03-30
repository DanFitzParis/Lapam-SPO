"use client"

import { useEffect, useState } from "react"
import { useOrganization } from "@clerk/nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function UsersPage() {
  const { organization } = useOrganization()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMembers() {
      if (!organization) return

      try {
        const memberList = await organization.getMemberships()
        setMembers(memberList.data)
      } catch (error) {
        console.error('Failed to load members:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [organization])

  async function assignToLocation(userId: string, locationId: string) {
    try {
      const res = await fetch(`/api/locations/${locationId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: userId }),
      })

      if (!res.ok) throw new Error('Failed to assign')
      
      alert('User assigned successfully')
    } catch (error) {
      console.error(error)
      alert('Failed to assign user')
    }
  }

  function getUserDisplay(member: any): string {
    const userData = member.publicUserData
    
    if (userData) {
      // Try full name first
      if (userData.firstName || userData.lastName) {
        return [userData.firstName, userData.lastName].filter(Boolean).join(' ')
      }
      
      // Fall back to identifier (email)
      if (userData.identifier) {
        return userData.identifier
      }
    }
    
    // Last resort: show user ID
    return member.userId || userData?.userId || 'Unknown'
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{getUserDisplay(member)}</TableCell>
              <TableCell>{member.role || '—'}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const locationId = prompt('Enter location ID to assign:')
                    if (locationId) {
                      const userId = member.publicUserData?.userId || member.userId
                      assignToLocation(userId, locationId)
                    }
                  }}
                >
                  Assign
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-sm text-gray-500 mt-4">
        Note: Full user management UI with location selection dropdown to be implemented in production.
      </p>
    </div>
  )
}
