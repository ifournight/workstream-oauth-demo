import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      {children}
    </thead>
  )
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={className}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  )
}
