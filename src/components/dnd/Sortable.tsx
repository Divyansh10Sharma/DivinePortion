import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// Reordering (PLAN-1, PLAN-5, ANIM-7) with dnd-kit (§11.9): drag starts ONLY from the grip handle,
// so swiping/scrolling anywhere else on the row keeps working on iPhone.

/** Keep the dragged row on the vertical axis. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function SortableList({
  ids,
  onMove,
  children,
}: {
  ids: string[];
  onMove: (fromId: string, toId: string) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    // A few px of movement before a drag starts, so a tap on the handle isn't a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[verticalOnly]} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export type HandleProps = HTMLAttributes<HTMLButtonElement>;

/**
 * A sortable row. `children` receives the props for the drag handle.
 * dnd-kit animates neighbours sliding out of the way with transform transitions (ANIM-7);
 * the lifted row gets a shadow and slight scale.
 */
export function SortableRow({ id, children }: { id: string; children: (handle: HandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform ? { ...transform, scaleX: isDragging ? 1.02 : 1, scaleY: isDragging ? 1.02 : 1 } : null),
    transition,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
    boxShadow: isDragging ? '0 18px 32px -16px var(--deep-shadow)' : undefined,
    borderRadius: 18,
  };

  const handle: HandleProps = {
    ...attributes,
    ...listeners,
    // Stop the pointerdown from reaching a parent swipe-drag (SwipeToDelete).
    onPointerDown: (e) => {
      listeners?.onPointerDown?.(e);
      e.stopPropagation();
    },
    style: { touchAction: 'none', cursor: 'grab' },
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(handle)}
    </div>
  );
}

export function DragHandle({ label, ...props }: HandleProps & { label: string }) {
  return (
    <button type="button" aria-label={`Reorder ${label}`} {...props} className="-ml-1 flex h-10 w-8 shrink-0 items-center justify-center text-warm-grey/80">
      <GripVertical size={18} aria-hidden />
    </button>
  );
}
