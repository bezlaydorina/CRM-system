"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import clsx from "clsx";

export type KanbanColumn = {
  id: string;
  title: string;
  accentColor?: string;
};

export type KanbanItem = {
  id: string;
  columnId: string;
  node: ReactNode;
};

export function KanbanBoard({
  columns,
  items,
  onMove,
  columnWidthClass = "w-72",
}: {
  columns: KanbanColumn[];
  items: KanbanItem[];
  onMove: (itemId: string, toColumnId: string) => Promise<void>;
  columnWidthClass?: string;
}) {
  const [localItems, setLocalItems] = useState(items);
  const [renderedItems, setRenderedItems] = useState(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // @dnd-kit assigns each draggable/droppable a sequential internal id
  // (used for e.g. aria-describedby) from a module-level counter that
  // keeps incrementing across client-side navigations, so it never
  // matches the fresh counter value used during server rendering. Only
  // mounting the interactive DnD tree after the client has hydrated
  // (rendering an identical-looking, non-interactive board until then)
  // avoids that hydration mismatch entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Keep local (optimistic) state in sync whenever the server re-renders
  // this board with fresh props (e.g. after a revalidation). Adjusting
  // state during render (rather than in an effect) avoids an extra
  // commit/paint between the prop change and the state catching up.
  if (items !== renderedItems) {
    setRenderedItems(items);
    setLocalItems(items);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const itemId = String(active.id);
    const toColumnId = String(over.id);
    const current = localItems.find((i) => i.id === itemId);
    if (!current || current.columnId === toColumnId) return;

    setLocalItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, columnId: toColumnId } : i)));
    startTransition(() => {
      onMove(itemId, toColumnId).catch(() => {
        setLocalItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, columnId: current.columnId } : i)));
      });
    });
  }

  const activeItem = localItems.find((i) => i.id === activeId);

  if (!mounted) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <StaticColumn
            key={col.id}
            column={col}
            widthClass={columnWidthClass}
            items={localItems.filter((i) => i.columnId === col.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            widthClass={columnWidthClass}
            items={localItems.filter((i) => i.columnId === col.id)}
          />
        ))}
      </div>
      <DragOverlay>{activeItem ? <div className="rotate-1 opacity-90">{activeItem.node}</div> : null}</DragOverlay>
    </DndContext>
  );
}

/** Same layout as <Column>, but with no @dnd-kit hooks - used for the
 * server-rendered / pre-hydration first paint (see `mounted` above). */
function StaticColumn({
  column,
  items,
  widthClass,
}: {
  column: KanbanColumn;
  items: KanbanItem[];
  widthClass: string;
}) {
  return (
    <div className={clsx("flex-shrink-0", widthClass)}>
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.accentColor ?? "#a1a1aa" }} />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{column.title}</h3>
        </div>
        <span className="text-xs font-medium text-zinc-400">{items.length}</span>
      </div>
      <div className="flex min-h-[120px] flex-col gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-white shadow-sm">
            {item.node}
          </div>
        ))}
      </div>
    </div>
  );
}

function Column({
  column,
  items,
  widthClass,
}: {
  column: KanbanColumn;
  items: KanbanItem[];
  widthClass: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className={clsx("flex-shrink-0", widthClass)}>
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.accentColor ?? "#a1a1aa" }} />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{column.title}</h3>
        </div>
        <span className="text-xs font-medium text-zinc-400">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={clsx(
          "flex min-h-[120px] flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-indigo-400 bg-indigo-50" : "border-zinc-200 bg-zinc-50/50"
        )}
      >
        {items.map((item) => (
          <DraggableCard key={item.id} id={item.id}>
            {item.node}
          </DraggableCard>
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx("cursor-grab touch-none rounded-lg bg-white shadow-sm active:cursor-grabbing", isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}
