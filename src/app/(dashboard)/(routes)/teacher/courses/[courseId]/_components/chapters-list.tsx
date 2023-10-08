"use client";

import { Chapter } from "@prisma/client";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Grip, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type ChaptersListProps = {
  items: Chapter[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
};

export const ChaptersList = ({ items, onReorder, onEdit }: ChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [chapters, setChapters] = useState(items);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setChapters(items);
  }, [items]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    console.log("====================================");
    console.log("result", result);
    console.log("====================================");

    const items = Array.from(chapters); // makes a copy of the array
    const [reorderedItem] = items.splice(result.source.index, 1); // removes the dragged item from the array
    items.splice(result.destination.index, 0, reorderedItem); // adds the dragged item to the array at destination index

    const startIndex = Math.min(result.source.index, result.destination.index); // get the start index
    const endIndex = Math.max(result.source.index, result.destination.index); // get the end index

    const updatedChapters = items.slice(startIndex, endIndex + 1); // get the items that were updated

    setChapters(items); // update the state

    const bulkUpdateData = updatedChapters.map((chapter) => ({
      id: chapter.id,
      position: items.findIndex((item) => item.id === chapter.id),
    })); // create the bulk update data

    onReorder(bulkUpdateData);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chapters">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {chapters.map((chapter, index) => (
              <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                {(provided, snapshot) => {
                  // if (!provided.draggableProps.style) return;

                  // var transform = provided.draggableProps.style.transform;

                  // if (transform && provided.draggableProps.style) {
                  //   var t = transform.split(",")[1];
                  //   provided.draggableProps.style.transform = "translate(0px," + t;
                  // }

                  if (!provided.draggableProps.style) return;
                  if (!snapshot) return;
                  // Restrict dragging to vertical axis
                  let transform = provided.draggableProps.style.transform;

                  if (snapshot.isDragging && transform) {
                    transform = transform.replace(/\(.+\,/, "(0,");
                  }

                  const style = {
                    ...provided.draggableProps.style,
                    transform,
                  };

                  return (
                    <div
                      className={cn(
                        "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
                        chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700"
                      )}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={style}
                    >
                      <div
                        className={cn(
                          "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition",
                          chapter.isPublished && "border-r-sky-200 hover:bg-sky-200"
                        )}
                        {...provided.dragHandleProps}
                      >
                        <Grip className="h-5 w-5" />
                      </div>
                      {chapter.title}
                      <div className="ml-auto pr-2 flex items-center gap-x-2">
                        {chapter.isFree && <Badge>Free</Badge>}
                        <Badge className={cn("bg-slate-500", chapter.isPublished && "bg-sky-700")}>
                          {chapter.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Pencil
                          onClick={() => onEdit(chapter.id)}
                          className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
                        />
                      </div>
                    </div>
                  );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
