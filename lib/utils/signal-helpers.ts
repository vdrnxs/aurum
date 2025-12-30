import { SignalType } from "@/types/database"

export function getSignalVariant(signal: SignalType): "success" | "danger" | "warning" {
  if (signal === 'STRONG_BUY' || signal === 'BUY') return 'success'
  if (signal === 'STRONG_SELL' || signal === 'SELL') return 'danger'
  return 'warning'
}

export function getChartColor(variant: "success" | "danger" | "warning"): string {
  if (variant === 'success') return 'var(--success)'
  if (variant === 'danger') return 'var(--danger)'
  return 'var(--warning)'
}
