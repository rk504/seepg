import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Download, UploadCloud, Filter, ArrowUpDown, Loader2, Sparkles, Calendar, UserPlus2, PackageOpen, ShieldAlert } from "lucide-react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

/**
 * seepg — Promo Intelligence MVP (standalone)
 * -------------------------------------------------
 * A self-contained React dashboard that ingests two CSVs (orders & codes issued)
 * and visualizes the "crown jewel" metrics: ROI & PVI, plus leakage.
 *
 * Sexy UI/UX: Tailwind, shadcn/ui, subtle motion, clean layout.
 * No Shopify or platform dependency — just CSVs or inline demo data.
 *
 * CSV formats expected:
 * orders.csv
 *   order_id,order_date,customer_email,discount_code,subtotal,discount_amount,total
 *   1001,2025-08-01,alex@example.com,OLUKAI-ALEX10,120,12,108
 *
 * codes_issued.csv
 *   code,owner,issued_count
 *   OLUKAI-ALEX10,Alex Influencer,20
 */

// --- Demo sample data (used until the user uploads files) ---
const SAMPLE_ORDERS = `order_id,order_date,customer_email,discount_code,subtotal,discount_amount,total
1001,2025-08-01,alex@example.com,OLUKAI-ALEX10,120,12,108
1002,2025-08-02,beth@example.com,MELIN-BETH15,80,12,68
1003,2025-08-05,alex@example.com,OLUKAI-ALEX10,90,9,81
1004,2025-08-06,casey@example.com,OLUKAI-ALEX10,140,14,126
1005,2025-08-08,drew@example.com,TEAM-USA5,60,3,57
1006,2025-08-10,erin@example.com,TEAM-USA5,55,2.75,52.25
1007,2025-08-11,frank@example.com,INFL-SMITH20,200,40,160
1008,2025-08-14,georgia@example.com,INFL-SMITH20,75,15,60
1009,2025-08-15,harper@example.com,OLUKAI-ALEX10,110,11,99
1010,2025-08-18,ivan@example.com,MELIN-BETH15,95,14.25,80.75
1011,2025-08-22,jon@example.com,TEAM-USA5,70,3.5,66.5
1012,2025-08-25,kai@example.com,INFL-SMITH20,130,26,104
1013,2025-08-26,li@example.com,INFL-SMITH20,65,13,52
1014,2025-08-29,morgan@example.com,TEAM-USA5,85,4.25,80.75
1015,2025-08-30,nikki@example.com,OLUKAI-ALEX10,100,10,90`;

const SAMPLE_CODES = `code,owner,issued_count
OLUKAI-ALEX10,Alex Influencer,20
MELIN-BETH15,Beth Influencer,15
TEAM-USA5,Team USA Campaign,200
INFL-SMITH20,Coach Smith,30`;

// --- Types ---
interface OrderRow {
  order_id: string;
  order_date: string; // ISO date
  customer_email: string;
  discount_code: string;
  subtotal: number;
  discount_amount: number;
  total: number;
}

interface CodeIssuedRow {
  code: string;
  owner: string;
  issued_count: number;
}

interface SummaryRow {
  code: string;
  owner: string;
  issued_count: number;
  redemptions: number;
  revenue: number;
  discount_value: number;
  new_customers: number;
  new_customer_revenue: number;
  new_customer_rate: number | null;
  roi: number | null; // revenue / discount_value
  pvi: number | null; // new_customer_revenue / discount_value
  leakage: number; // issued - redeemed
}

// --- Helpers ---
function parseCsv<T = any>(csv: string): T[] {
  const res = Papa.parse(csv.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
  if (res.errors?.length) {
    console.warn("CSV parse errors", res.errors);
  }
  return (res.data as any[]).map((r) => {
    // normalize keys
    const obj: any = {};
    Object.keys(r).forEach((k) => {
      obj[k.trim()] = typeof r[k] === "string" ? (r[k] as string).trim() : r[k];
    });
    return obj as T;
  });
}

function toDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function currency(n: number | null | undefined) {
  if (n == null || isNaN(n as number)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function pct(n: number | null | undefined) {
  if (n == null || isNaN(n as number)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

// --- Main Component ---
export default function SeepgDashboard() {
  const [ordersCsv, setOrdersCsv] = useState<string>(SAMPLE_ORDERS);
  const [codesCsv, setCodesCsv] = useState<string>(SAMPLE_CODES);
  const [loading, setLoading] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof SummaryRow>("pvi");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { orders, codes } = useMemo(() => {
    try {
      const o = parseCsv<OrderRow>(ordersCsv).map((r) => ({
        ...r,
        subtotal: Number(r.subtotal),
        discount_amount: Number(r.discount_amount),
        total: Number(r.total),
      }));
      const c = parseCsv<CodeIssuedRow>(codesCsv).map((r) => ({
        ...r,
        issued_count: Number(r.issued_count),
      }));
      return { orders: o, codes: c };
    } catch (e) {
      console.error(e);
      return { orders: [], codes: [] };
    }
  }, [ordersCsv, codesCsv]);

  const filteredOrders = useMemo(() => {
    let out = orders;
    // date range filter
    const minD = dateFrom ? toDate(dateFrom) : null;
    const maxD = dateTo ? toDate(dateTo) : null;
    if (minD || maxD) {
      out = out.filter((o) => {
        const d = toDate(o.order_date);
        if (!d) return false;
        if (minD && d < minD) return false;
        if (maxD && d > maxD) return false;
        return true;
      });
    }
    return out;
  }, [orders, dateFrom, dateTo]);

  const summary = useMemo<SummaryRow[]>(() => {
    // first order per customer in filtered set → "new customer" proxy
    const sorted = [...filteredOrders].sort((a, b) => (toDate(a.order_date)!.getTime() - toDate(b.order_date)!.getTime()));
    const firstOrderPerEmail = new Map<string, string>(); // email -> order_id
    for (const row of sorted) {
      if (!firstOrderPerEmail.has(row.customer_email)) {
        firstOrderPerEmail.set(row.customer_email, row.order_id);
      }
    }

    // aggregate by code
    const byCode = new Map<string, SummaryRow>();
    for (const row of filteredOrders) {
      const code = row.discount_code || "";
      if (!byCode.has(code)) {
        const meta = codes.find((c) => c.code === code);
        byCode.set(code, {
          code,
          owner: meta?.owner || "—",
          issued_count: meta?.issued_count ?? 0,
          redemptions: 0,
          revenue: 0,
          discount_value: 0,
          new_customers: 0,
          new_customer_revenue: 0,
          new_customer_rate: null,
          roi: null,
          pvi: null,
          leakage: 0,
        });
      }
      const agg = byCode.get(code)!;
      agg.redemptions += 1;
      agg.revenue += Number(row.total) || 0;
      agg.discount_value += Number(row.discount_amount) || 0;
      const isNew = firstOrderPerEmail.get(row.customer_email) === row.order_id;
      if (isNew) {
        agg.new_customers += 1;
        agg.new_customer_revenue += Number(row.total) || 0;
      }
    }

    // finalize
    const rows: SummaryRow[] = Array.from(byCode.values()).map((r) => {
      r.leakage = (r.issued_count || 0) - (r.redemptions || 0);
      r.roi = r.discount_value > 0 ? r.revenue / r.discount_value : null;
      r.pvi = r.discount_value > 0 ? r.new_customer_revenue / r.discount_value : null;
      r.new_customer_rate = r.redemptions > 0 ? r.new_customers / r.redemptions : null;
      return r;
    });

    // owner filter
    const filt = ownerFilter
      ? rows.filter((r) => (r.owner || "").toLowerCase().includes(ownerFilter.toLowerCase()) || r.code.toLowerCase().includes(ownerFilter.toLowerCase()))
      : rows;

    // sorting
    const sortedRows = [...filt].sort((a: any, b: any) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (av === bv) return a.code.localeCompare(b.code);
      return sortAsc ? av - bv : bv - av;
    });

    return sortedRows;
  }, [filteredOrders, codes, ownerFilter, sortKey, sortAsc]);

  const portfolio = useMemo(() => {
    const totals = summary.reduce(
      (acc, r) => {
        acc.redemptions += r.redemptions;
        acc.revenue += r.revenue;
        acc.discount_value += r.discount_value;
        acc.new_customer_revenue += r.new_customer_revenue;
        acc.issued += r.issued_count;
        acc.leakage += r.leakage;
        return acc;
      },
      { redemptions: 0, revenue: 0, discount_value: 0, new_customer_revenue: 0, issued: 0, leakage: 0 }
    );
    const pvi = totals.discount_value > 0 ? totals.new_customer_revenue / totals.discount_value : null;
    const roi = totals.discount_value > 0 ? totals.revenue / totals.discount_value : null;
    return { ...totals, pvi, roi };
  }, [summary]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setter(String(reader.result || ""));
      setLoading(false);
    };
    reader.readAsText(file);
  }

  function downloadCsv(rows: SummaryRow[]) {
    const headers = [
      "code","owner","issued_count","redemptions","leakage","revenue","discount_value","new_customer_revenue","roi","pvi","new_customer_rate"
    ];
    const lines = [headers.join(",")].concat(
      rows.map((r) =>
        [
          r.code,
          r.owner,
          r.issued_count,
          r.redemptions,
          r.leakage,
          r.revenue,
          r.discount_value,
          r.new_customer_revenue,
          r.roi ?? "",
          r.pvi ?? "",
          r.new_customer_rate ?? "",
        ].join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seepg_leaderboard_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const top5 = summary.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold tracking-tight text-xl">seepg</span>
            <span className="ml-2 text-slate-500 hidden md:inline">Promo Intelligence (Standalone MVP)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadCsv(summary)}>
              <Download className="w-4 h-4 mr-1" /> Export Leaderboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="col-span-2 shadow-lg rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" /> Load your data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Orders CSV</Label>
                  <Input type="file" accept=".csv" onChange={(e) => handleFile(e, setOrdersCsv)} />
                </div>
                <div>
                  <Label className="text-sm">Codes Issued CSV</Label>
                  <Input type="file" accept=".csv" onChange={(e) => handleFile(e, setCodesCsv)} />
                </div>
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Parsing CSVs…
                </div>
              )}
              <p className="text-xs text-slate-500">
                Tip: Use the demo data out of the box, or drop in your own CSVs. Columns should match the examples above.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-600" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
                  <span className="text-slate-400">to</span>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus2 className="w-4 h-4 text-slate-500" />
                  <Input placeholder="Filter by owner or code…" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  <select
                    className="h-9 border rounded-md px-2 text-sm"
                    value={String(sortKey)}
                    onChange={(e) => setSortKey(e.target.value as keyof SummaryRow)}
                  >
                    <option value="pvi">Sort by PVI</option>
                    <option value="roi">Sort by ROI</option>
                    <option value="redemptions">Sort by Redemptions</option>
                    <option value="revenue">Sort by Revenue</option>
                    <option value="leakage">Sort by Leakage</option>
                  </select>
                  <Button size="sm" variant="outline" onClick={() => setSortAsc(!sortAsc)}>
                    {sortAsc ? "Asc" : "Desc"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Portfolio PVI</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{portfolio.pvi != null ? portfolio.pvi.toFixed(2) : "—"}</CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Portfolio ROI</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{portfolio.roi != null ? portfolio.roi.toFixed(2) : "—"}</CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Total Redemptions</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{portfolio.redemptions}</CardContent>
          </Card>
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-1"><CardTitle className="text-sm font-medium">Total Leakage</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{portfolio.leakage}</CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <Card className="rounded-2xl shadow-md lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Leaderboard (by PVI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-500 border-b">
                    <tr>
                      <th className="py-2 pr-4">Code</th>
                      <th className="py-2 pr-4">Owner</th>
                      <th className="py-2 pr-4">Issued</th>
                      <th className="py-2 pr-4">Redeemed</th>
                      <th className="py-2 pr-4">Leakage</th>
                      <th className="py-2 pr-4">Revenue</th>
                      <th className="py-2 pr-4">Discount</th>
                      <th className="py-2 pr-4">New Rev</th>
                      <th className="py-2 pr-4">ROI</th>
                      <th className="py-2 pr-4">PVI</th>
                      <th className="py-2">New %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((r) => (
                      <tr key={r.code} className="border-b last:border-0 hover:bg-slate-50/70">
                        <td className="py-2 pr-4 font-medium">{r.code}</td>
                        <td className="py-2 pr-4">{r.owner}</td>
                        <td className="py-2 pr-4">{r.issued_count}</td>
                        <td className="py-2 pr-4">{r.redemptions}</td>
                        <td className={`py-2 pr-4 ${r.leakage > 0 ? "text-rose-600" : ""}`}>{r.leakage}</td>
                        <td className="py-2 pr-4">{currency(r.revenue)}</td>
                        <td className="py-2 pr-4">{currency(r.discount_value)}</td>
                        <td className="py-2 pr-4">{currency(r.new_customer_revenue)}</td>
                        <td className="py-2 pr-4">{r.roi != null ? r.roi.toFixed(2) : "—"}</td>
                        <td className="py-2 pr-4 font-semibold">{r.pvi != null ? r.pvi.toFixed(2) : "—"}</td>
                        <td className="py-2">{pct(r.new_customer_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" /> Leakage Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top5} barSize={24}>
                  <CartesianGrid vertical={false} stroke="#eef2ff" />
                  <XAxis dataKey="code" tick={{ fontSize: 12 }} angle={-10} height={50} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leakage" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <Card className="rounded-2xl shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="w-5 h-5 text-indigo-600" /> PVI by Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={top5}>
                  <CartesianGrid vertical={false} stroke="#eef2ff" />
                  <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="pvi" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> New vs Repeat (Top 5 Codes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top5} barSize={24}>
                  <CartesianGrid vertical={false} stroke="#eef2ff" />
                  <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="new_customers" stackId="a" />
                  <Bar dataKey={(d:any) => Math.max(d.redemptions - d.new_customers, 0)} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-10 pb-10 text-center text-xs text-slate-500">
          <div className="italic">seepg — turning promo spend into intelligence.</div>
        </footer>
      </main>
    </div>
  );
}
