import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { X } from 'lucide-react';

const componentsList = [
  { id: 'MapSection', label: 'Map Section' },
  { id: 'DeviceStatus', label: 'Device Status' },
  { id: 'BranchTable', label: 'Branch Table' },
  { id: 'RecentActivities', label: 'Recent Activities' },
  { id: 'AlertReports', label: 'Alert Reports' },
];

interface LayoutItem {
  id: string;
  width: string;
}

interface LayoutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: LayoutItem[];
  onSave: (layout: LayoutItem[]) => void;
}

const SortableItem = ({
  item,
  index,
  updateWidth,
}: {
  item: LayoutItem;
  index: number;
  updateWidth: (index: number, newWidth: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const label = componentsList.find(c => c.id === item.id)?.label || item.id;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="p-3 bg-white border rounded shadow-sm flex items-center justify-between gap-3"
    >
      <div className="cursor-move flex-1">{label}</div>
      <select
        className="form-select form-select-sm w-auto"
        value={item.width}
        onChange={(e) => updateWidth(index, e.target.value)}
      >
        <option value="col-md-12">Full (12)</option>
        <option value="col-md-8">8/12</option>
        <option value="col-md-6">6/12</option>
        <option value="col-md-4">4/12</option>
      </select>
    </div>
  );
};

const LayoutEditorModal = ({
  isOpen,
  onClose,
  layout,
  onSave,
}: LayoutEditorModalProps) => {
  const [items, setItems] = useState<LayoutItem[]>(layout);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const updateWidth = (index: number, newWidth: string) => {
    const updated = [...items];
    updated[index].width = newWidth;
    setItems(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute top-2 right-2">
          <X />
        </button>
        <h2 className="text-xl font-bold mb-4">Edit Dashboard Layout</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableItem key={item.id} item={item} index={index} updateWidth={updateWidth} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full"
          onClick={() => {
            onSave(items);
            onClose();
          }}
        >
          Save Layout
        </button>
      </div>
    </div>
  );
};

export default LayoutEditorModal;
