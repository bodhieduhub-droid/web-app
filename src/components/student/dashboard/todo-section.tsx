import { createAdminClient } from "@/lib/supabase/admin";
import { createTodoItemAction, toggleTodoItemAction } from "@/app/(dashboard)/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import type { TodoItemRecord } from "@/lib/app-types";
import { CheckCircle2, ListTodo, Plus, Circle, Sparkles } from "lucide-react";

const QUICK_TASKS = ["Revision", "Mock Test", "Practice Qs", "Read Current Affairs"];

export async function StudentTodoSection({ studentId }: { studentId: string }) {
  const supabase = createAdminClient();
  const { data: todoItems } = await supabase
    .from("todo_items")
    .select("*")
    .eq("reader_id", studentId)
    .order("created_at", { ascending: false });

  const allTodos = (todoItems ?? []) as TodoItemRecord[];
  const pendingTodos = allTodos.filter((t) => !t.is_completed);
  const completedToday = allTodos.filter((t) => t.is_completed).length;

  return (
    <div className="rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/5 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#6d7c6c]">Focus Checklist</p>
          <h2 className="mt-2 text-2xl font-black text-[#1b3022]">Your Daily Tasks</h2>
        </div>
        <div className="flex flex-col items-end">
          {pendingTodos.length > 0 ? (
            <span className="flex items-center gap-2 rounded-full bg-[#1b3022] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-[#1b3022]/20">
              <ListTodo className="h-3 w-3" />
              {pendingTodos.length} Tasks Remaining
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              <Sparkles className="h-3 w-3" />
              All Caught Up!
            </span>
          )}
        </div>
      </div>

      {/* Quick Add Chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {QUICK_TASKS.map((task) => (
          <form key={task} action={createTodoItemAction}>
            <input type="hidden" name="title" value={task} />
            <button 
              type="submit" 
              className="rounded-full border border-[#d8e0d4] bg-[#f7faf5] px-3 py-1 text-[10px] font-bold text-[#6d7c6c] transition-all hover:border-[#1b3022] hover:bg-[#1b3022] hover:text-white"
            >
              + {task}
            </button>
          </form>
        ))}
      </div>

      <form action={createTodoItemAction} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input 
            name="title"
            placeholder="What's your next study goal?"
            maxLength={120}
            className="w-full rounded-2xl border border-[#d7ddd3] bg-[#f7faf5] px-5 py-4 text-sm font-semibold text-[#1b3022] outline-none transition-all focus:border-[#1b3022]/30 focus:bg-white focus:ring-4 focus:ring-[#1b3022]/5"
          />
        </div>
        <PendingSubmitButton 
          idleLabel={<Plus className="h-5 w-5" />} 
          pendingLabel="..." 
          className="flex items-center justify-center rounded-2xl bg-[#1b3022] px-6 py-4 text-white shadow-lg shadow-[#1b3022]/20 transition-all hover:scale-[1.05] active:scale-[0.95]" 
        />
      </form>

      <div className="mt-8 space-y-3">
        {allTodos.length > 0 ? (
          allTodos.map((item) => (
            <div 
              key={item.id} 
              className={`group flex items-center gap-4 rounded-3xl border p-4 transition-all ${item.is_completed ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-[#f8faf7] border-[#e8efe5] hover:shadow-md'}`}
            >
              <form action={toggleTodoItemAction} className="flex flex-1 items-center gap-4">
                <input type="hidden" name="todo_id" value={item.id} />
                <input type="hidden" name="completed" value={item.is_completed ? "true" : "false"} />
                <button 
                  type="submit"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${item.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#1b3022]/20 bg-white group-hover:border-[#1b3022]/40'}`}
                >
                  {item.is_completed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3 text-transparent" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold ${item.is_completed ? "line-through text-gray-400" : "text-[#1b3022]"}`}>
                    {item.title}
                  </p>
                </div>
                <PendingSubmitButton 
                  idleLabel={item.is_completed ? "Undo" : "Done"} 
                  pendingLabel="…" 
                  className={`text-[10px] font-black uppercase tracking-wider ${item.is_completed ? 'text-gray-400' : 'text-[#1b3022]'}`} 
                />
              </form>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f7ed] text-[#1b3022]">
              <ListTodo className="h-8 w-8 opacity-20" />
            </div>
            <p className="text-sm font-bold text-[#6d7c6c]">No tasks for today. Add one above!</p>
          </div>
        )}
      </div>
      
      {completedToday > 0 && (
        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-[#8a9d88]">
          You've completed {completedToday} task{completedToday !== 1 ? 's' : ''} today. Great job!
        </p>
      )}
    </div>
  );
}

export function TodoSkeleton() {
  return (
    <div className="space-y-4 rounded-[2.4rem] border border-[#d8e0d4] bg-white p-6 shadow-xl shadow-[#27452e]/5 lg:p-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
      <div className="h-14 w-full animate-pulse rounded-2xl bg-gray-50" />
      <div className="space-y-3">
        <div className="h-16 w-full animate-pulse rounded-3xl bg-gray-50/50" />
        <div className="h-16 w-full animate-pulse rounded-3xl bg-gray-50/50" />
      </div>
    </div>
  );
}
