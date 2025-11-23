import { Package, X } from "lucide-react";
import Draggable from "react-draggable";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Item, generateItem } from "../utils/contentGenerator";
import { inventoryDebug, animationDebug } from "../utils/debug";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  onAddItem?: (item: Item) => void;
  onRemoveItem?: (item: Item) => void;
}

const RARITY_COLORS = {
  common: "border-gray-500 bg-gray-500/20",
  uncommon: "border-green-500 bg-green-500/20",
  rare: "border-blue-500 bg-blue-500/20",
  epic: "border-purple-500 bg-purple-500/20",
  legendary: "border-yellow-500 bg-yellow-500/20",
};

export const InventoryPanel = ({
  isOpen,
  onClose,
  items,
  onAddItem,
  onRemoveItem,
}: InventoryPanelProps) => {
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const inventoryNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inventoryDebug.log("action", "Inventory panel opened", { itemCount: items.length });
      animationDebug.start("InventoryPanel", "open");
    } else {
      inventoryDebug.log("info", "Inventory panel closed");
    }
  }, [isOpen, items.length]);

  const handleGenerateItem = () => {
    const newItem = generateItem();
    onAddItem?.(newItem);
    inventoryDebug.add(newItem);
  };

  const handleRemoveItem = (item: Item) => {
    onRemoveItem?.(item);
    inventoryDebug.remove(item);
  };

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      <Draggable 
        nodeRef={inventoryNodeRef}
        handle=".inventory-handle"
        defaultPosition={{ x: typeof window !== "undefined" ? window.innerWidth - 340 : 0, y: 80 }}
      >
        <div
          ref={inventoryNodeRef}
          style={{
            position: "fixed",
            zIndex: 50,
            left: 0,
            top: 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onAnimationStart={() => animationDebug.start("InventoryPanel", "mount")}
            onAnimationComplete={() => animationDebug.complete("InventoryPanel", "mount")}
            className="w-80 bg-card border-2 border-primary/30 rounded-lg shadow-2xl"
          >
          <div 
            className="inventory-handle cursor-move flex items-center justify-between p-4 bg-secondary/30 border-b-2 border-primary/30 rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-primary">Inventory</h3>
              <span className="text-xs text-muted-foreground">
                ({items.length} items)
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onMouseDown={(e) => {
                // Prevent dragging when clicking close
                e.stopPropagation();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Your inventory is empty</p>
                {onAddItem && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleGenerateItem}
                  >
                    Generate Test Item
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={`${item.name}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`relative p-3 rounded-lg border-2 ${RARITY_COLORS[item.rarity]} cursor-pointer transition-all hover:shadow-lg`}
                            draggable
                            onDragStart={() => setDraggedItem(item)}
                            onDragEnd={() => setDraggedItem(null)}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="text-2xl">
                                {item.type === "weapon" && "⚔️"}
                                {item.type === "armor" && "🛡️"}
                                {item.type === "consumable" && "🧪"}
                                {item.type === "misc" && "📦"}
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-foreground truncate w-full">
                                  {item.name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {item.rarity}
                                </p>
                                <p className="text-xs text-primary font-mono mt-1">
                                  {item.value}G
                                </p>
                              </div>
                            </div>
                            {onRemoveItem && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItem(item);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-bold">{item.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {item.type} · {item.rarity}
                            </p>
                            <p className="text-sm">{item.description}</p>
                            <p className="text-xs text-primary font-mono">
                              Value: {item.value} Gold
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {onAddItem && (
            <div className="p-4 border-t-2 border-primary/30">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGenerateItem}
              >
                <Package className="w-4 h-4 mr-2" />
                Generate Random Item
              </Button>
            </div>
          )}
          </motion.div>
        </div>
      </Draggable>
    </TooltipProvider>
  );
};

