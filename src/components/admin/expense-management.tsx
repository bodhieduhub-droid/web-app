"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { createExpenseAction, updateExpenseAction, deleteExpenseAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  profiles?: { full_name: string | null } | null;
};

const CATEGORIES = [
  "Rent",
  "Electricity",
  "Water",
  "Cleaning",
  "Internet",
  "Maintenance",
  "Stationery",
  "Marketing",
  "Staff Salary",
  "Other",
];

export function ExpenseManagement({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredExpenses = expenses.filter((e) => {
    const matchesQuery = (e.description || "").toLowerCase().includes(query.toLowerCase()) ||
                         (e.category || "").toLowerCase().includes(query.toLowerCase()) ||
                         e.amount.toString().includes(query);
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    const formData = new FormData();
    formData.append("id", id);
    await deleteExpenseAction(formData);
    setExpenses(expenses.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search expenses..."
            className="w-full sm:w-80 rounded-2xl border border-[#d8e0d4] bg-white px-4 py-2.5 text-sm font-semibold text-[#1b3022] outline-none shadow-sm transition-all focus:border-[#1b3022] focus:ring-4 focus:ring-[#1b3022]/5"
          />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 rounded-2xl border border-[#d8e0d4] bg-white px-4 py-2.5 text-sm font-black text-[#1b3022] outline-none shadow-sm transition-all focus:border-[#1b3022]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#1b3022] px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-black shadow-lg shadow-[#1b3022]/10"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {isAdding && (
        <form
          action={async (formData) => {
            const res = await createExpenseAction(formData);
            if (res?.success) {
              setIsAdding(false);
              // In a real app, we'd probably revalidate or refresh the page
              window.location.reload();
            } else if (res?.error) {
              alert(res.error);
            }
          }}
          className="grid gap-4 rounded-3xl border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/8 md:grid-cols-4"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7b69]">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              className="w-full rounded-xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-2 text-sm font-bold outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7b69]">Category</label>
            <select
              name="category"
              required
              className="w-full rounded-xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-2 text-sm font-bold outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7b69]">Date</label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full rounded-xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-2 text-sm font-bold outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7b69]">Description</label>
            <input
              name="description"
              className="w-full rounded-xl border border-[#d7ddd3] bg-[#f7faf5] px-4 py-2 text-sm font-bold outline-none"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-[#d8e0d4] px-4 py-2 text-sm font-bold text-[#4e5d4d]"
            >
              Cancel
            </button>
            <PendingSubmitButton
              idleLabel="Save Expense"
              pendingLabel="Saving..."
              className="rounded-xl bg-[#1b3022] px-6 py-2 text-sm font-bold text-white shadow-lg shadow-[#1b3022]/20"
            />
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-[#d8e0d4] bg-white shadow-xl shadow-[#27452e]/5">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f5f8f3] text-[11px] font-black uppercase tracking-[0.2em] text-[#6d7c6c]">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Recorded By</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef3ea]">
            {filteredExpenses.map((expense) => {
              const isEditing = editingId === expense.id;
              return (
                <tr key={expense.id} className="text-sm font-semibold text-[#1b3022]">
                  <td className="px-6 py-4">{expense.date}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-[#f0f4ee] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[#4e5d4d]">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black">₹{expense.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-[#536352]">{expense.description || "—"}</td>
                  <td className="px-6 py-4 text-xs font-bold text-[#6b7b69]">
                    {expense.profiles?.full_name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#6b7b69] italic">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
