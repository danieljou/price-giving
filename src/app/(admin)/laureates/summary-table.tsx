import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LaureateRow } from "./columns";
import { buildSummary, formatSummaryCell } from "./summary";

interface SummaryTableProps {
  rows: LaureateRow[];
}

/** On-screen equivalent of the "Synthèse" section printed on the PDF/Word
 *  exports — prize x cycle breakdown, computed from the same buildSummary
 *  so the numbers can't drift from what gets printed. */
export function SummaryTable({ rows }: Readonly<SummaryTableProps>) {
  const summary = buildSummary(rows);

  return (
    <div className="rounded-sm bg-card ring-1 ring-foreground/10 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Synthèse</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
              <TableHead className="h-9 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                &nbsp;
              </TableHead>
              {summary.cycles.map((cycle) => (
                <TableHead
                  key={cycle}
                  className="h-9 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {cycle}
                </TableHead>
              ))}
              <TableHead className="h-9 px-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.rows.map((row) => (
              <TableRow
                key={row.label}
                className={
                  row.emphasis
                    ? "bg-muted/40 hover:bg-muted/40 border-b border-border font-semibold"
                    : "border-b border-border last:border-b-0"
                }
              >
                <TableCell className="px-3 py-2 text-xs font-medium">
                  {row.label}
                </TableCell>
                {row.values.map((v, i) => (
                  <TableCell
                    key={summary.cycles[i]}
                    className="px-3 py-2 text-center font-mono text-xs"
                  >
                    {formatSummaryCell(v)}
                  </TableCell>
                ))}
                <TableCell className="px-3 py-2 text-center font-mono text-xs">
                  {row.total}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/60 hover:bg-muted/60 font-semibold">
              <TableCell
                colSpan={summary.cycles.length + 1}
                className="px-3 py-2 text-xs"
              >
                TOTAL
              </TableCell>
              <TableCell className="px-3 py-2 text-center font-mono text-xs">
                {summary.grandTotal}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
