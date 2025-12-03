import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCart } from "../../../context/CartContext";
import DressCartItem from "./DressCartItem";

export default function DraggableDressList() {
  const { items, reorderDresses } = useCart();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de mouvement avant de considérer comme drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.dress.id === active.id);
    const newIndex = items.findIndex((item) => item.dress.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderDresses(oldIndex, newIndex);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900/50 dark:ring-white/10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Robes sélectionnées
        </h2>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 dark:bg-blue-900/20">
          <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Glissez pour réorganiser
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.dress.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <DressCartItem
                key={item.dress.id}
                dress={item.dress}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length > 0 && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Astuce
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Utilisez le glisser-déposer pour organiser les robes par ordre de priorité.
                Pour les contrats forfaitaires, marquez la robe principale en cliquant sur l'étoile.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
