"use client"

import { useState } from "react"
import { TradingSignal } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDateTime } from "@/lib/utils/formatters"
import { cn } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface SignalsTableProps {
  signals: TradingSignal[]
}

const ITEMS_PER_PAGE = 10

export function SignalsTable({ signals }: SignalsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (signals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No signals available</p>
      </div>
    )
  }

  // Calculate pagination
  const totalPages = Math.ceil(signals.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSignals = signals.slice(startIndex, endIndex)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Created At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Entry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Stop Loss
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Take Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {currentSignals.map((signal) => {
                const isHold = signal.signal === 'HOLD'

                return (
                  <tr key={signal.id} className="transition-colors hover:bg-accent">
                    <td className="whitespace-nowrap px-4 py-3 text-left text-sm text-foreground">
                      {formatDateTime(signal.created_at)}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className="text-sm font-semibold text-foreground">
                        {signal.confidence.toFixed(0)}%
                      </span>
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-left font-mono text-sm",
                      isHold ? "text-muted-foreground italic" : "font-semibold text-foreground"
                    )}>
                      {formatPrice(signal.entry_price)}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {isHold ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="danger" className="font-mono text-xs">
                          {formatPrice(signal.stop_loss)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {isHold ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="success" className="font-mono text-xs">
                          {formatPrice(signal.take_profit)}
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}