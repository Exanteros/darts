"use client"
import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Save, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Undo, 
  Redo, 
  Type, 
  Image as ImageIcon, 
  Layout, 
  MousePointer2,
  Box,
  Heading,
  Settings,
  GripVertical,
  Trash2,
  Columns
} from 'lucide-react'

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// --- Types ---

type ComponentType = 'heading' | 'text' | 'button' | 'image' | 'container' | 'columns'

interface EditorComponent {
  id: string
  type: ComponentType
  content: any
  styles: React.CSSProperties
  children: EditorComponent[] // Enabled recursion
}

// --- Helper Functions for Tree Structure ---

function findComponentNode(items: EditorComponent[], id: string): EditorComponent | undefined {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children.length > 0) {
      const found = findComponentNode(item.children, id)
      if (found) return found
    }
  }
  return undefined
}

function findContainer(items: EditorComponent[], id: string): string | undefined {
  if (items.find(i => i.id === id)) return 'root';
  
  for (const item of items) {
    // If the item itself is the container (we might be dragging over the container directly)
    if (item.id === id && (item.type === 'container' || item.type === 'columns')) return item.id
    
    // Look inside children
    if (item.children.find(c => c.id === id)) return item.id
    
    const foundInside = findContainer(item.children, id)
    if (foundInside) return foundInside
  }
  return undefined
}

// --- Initial Data ---

const initialComponents: EditorComponent[] = [
  {
    id: 'header-1',
    type: 'heading',
    content: { text: 'Turnier Übersicht' },
    styles: { fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '1rem', color: '#1a1a1a' },
    children: []
  },
  {
    id: 'intro-container',
    type: 'container',
    content: { text: '' },
    styles: { padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '2rem' },
    children: [
       {
        id: 'text-1',
        type: 'text',
        content: { text: 'Dies ist ein Container. Du kannst Elemente hier hinein ziehen!' },
        styles: { fontSize: '1.1rem', textAlign: 'center', color: '#4a4a4a' },
        children: []
      },
      {
        id: 'btn-1',
        type: 'button',
        content: { text: 'Verschachtelter Button', url: '#' },
        styles: { backgroundColor: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '4px', margin: '10px auto', display: 'block' },
        children: []
      }
    ]
  }
]

// --- Sortable Item Component ---

function SortableComponent({ 
  component, 
  isSelected, 
  onSelect,
  renderContent 
}: { 
  component: EditorComponent, 
  isSelected: boolean, 
  onSelect: () => void,
  renderContent: (component: EditorComponent) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: component.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`
        group relative mb-2 transition-all ring-offset-2
        ${isSelected ? 'ring-2 ring-blue-500 rounded-sm' : 'hover:ring-1 hover:ring-blue-300'}
      `}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Drag Handle - Visible on Hover or Selected */}
      <div 
        {...attributes} 
        {...listeners} 
        className={`
          absolute -left-8 top-0 p-1.5 cursor-grab active:cursor-grabbing rounded bg-white shadow-sm border
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isSelected ? 'opacity-100' : ''}
        `}
      >
        <GripVertical className="h-4 w-4 text-gray-500" />
      </div>

      {/* Component Content */}
      <div className="cursor-default">
        {renderContent(component)}
      </div>
      
      {/* Component Type Label */}
      {isSelected && (
        <div className="absolute -top-3 right-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider font-semibold pointer-events-none">
          {component.type}
        </div>
      )}
    </div>
  )
}

// --- Main Editor Page ---

export default function EditorPage() {
  const params = useParams()
  const themeId = params.themeid as string
  
  const [components, setComponents] = useState<EditorComponent[]>(initialComponents)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const selectedComponent = selectedId ? findComponentNode(components, selectedId) : undefined

  // Drag & Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Prevent accidental drags
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    // Helper to traverse and update items
    // NOTE: In a production app, use immer or similar for immutable updates on complex trees
    
    // Logic: moving between containers is handled here
    const activeId = active.id
    const overId = over.id

    // Find containers
    const activeContainerId = findContainer(components, activeId)
    const overContainerId = findContainer(components, overId)

    if (!activeContainerId || !overContainerId || activeContainerId === overContainerId) return

    // Move logic during drag (visual update)
    setComponents((prev) => {
      const activeItems = activeContainerId === 'root' ? prev : findComponentNode(prev, activeContainerId)?.children || []
      const overItems = overContainerId === 'root' ? prev : findComponentNode(prev, overContainerId)?.children || []
      
      const activeIndex = activeItems.findIndex(i => i.id === activeId)
      const overIndex = overItems.findIndex(i => i.id === overId)

      let newIndex
      if (overId in overItems) {
        newIndex = overItems.length + 1
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }
      
      // Deep clone to avoid mutation errors
      const newRoot = JSON.parse(JSON.stringify(prev))
      
      // Remove from source
      let itemToMove: EditorComponent | undefined
      
      const removeFromList = (list: EditorComponent[]) => {
        const idx = list.findIndex(i => i.id === activeId)
        if (idx !== -1) {
          itemToMove = list[idx]
          list.splice(idx, 1)
          return true
        }
        for (const item of list) {
          if (removeFromList(item.children)) return true
        }
        return false
      }
      removeFromList(newRoot)

      // Add to target
      if (itemToMove) {
        const addToList = (list: EditorComponent[], containerId: string) => {
           if (containerId === 'root') {
             list.splice(newIndex, 0, itemToMove!)
             return true
           }
           for (const item of list) {
             if (item.id === containerId) {
                item.children.splice(newIndex, 0, itemToMove!)
                return true
             }
             if (addToList(item.children, containerId)) return true
           }
           return false
        }
        addToList(newRoot, overContainerId)
      }

      return newRoot
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeContainerId = findContainer(components, active.id as string)
    const overContainerId = findContainer(components, over.id as string)

    if (activeContainerId === overContainerId) {
      const containerId = activeContainerId
       setComponents((prev) => {
          const newRoot = JSON.parse(JSON.stringify(prev))
          
          const sortList = (list: EditorComponent[]) => {
             const oldIndex = list.findIndex(i => i.id === active.id)
             const newIndex = list.findIndex(i => i.id === over.id)
             
             if (oldIndex !== -1 && newIndex !== -1) {
               return arrayMove(list, oldIndex, newIndex)
             }
             return list
          }

          if (containerId === 'root') {
             return sortList(newRoot)
          } else {
             // Find container and sort children
             const findAndSort = (items: EditorComponent[]) => {
                for (const item of items) {
                   if (item.id === containerId) {
                      item.children = sortList(item.children)
                      return
                   }
                   findAndSort(item.children)
                }
             }
             findAndSort(newRoot)
             return newRoot
          }
       })
    }
  }

  const handleUpdateComponent = (id: string, updates: Partial<EditorComponent>) => {
     setComponents(prev => {
        const updateRecursive = (items: EditorComponent[]): EditorComponent[] => {
           return items.map(item => {
              if (item.id === id) return { ...item, ...updates }
              if (item.children.length > 0) return { ...item, children: updateRecursive(item.children) }
              return item
           })
        }
        return updateRecursive(prev)
     })
  }
  
  // Helper for deep updates
  const handleUpdateContentRecursive = (id: string, field: string, value: any) => {
    setComponents(prev => {
       const update = (items: EditorComponent[]): EditorComponent[] => {
          return items.map(item => {
             if (item.id === id) return { ...item, content: { ...item.content, [field]: value } }
             if (item.children.length > 0) return { ...item, children: update(item.children) }
             return item
          })
       }
       return update(prev)
    })
  }

  // Wrapper to match old signature
  const handleUpdateContent = (id: string, field: string, value: any) => {
    handleUpdateContentRecursive(id, field, value)
  }

  const handleUpdateStyles = (id: string, newStyles: React.CSSProperties) => {
     setComponents(prev => {
        const update = (items: EditorComponent[]): EditorComponent[] => {
           return items.map(item => {
              if (item.id === id) return { ...item, styles: { ...item.styles, ...newStyles } }
              if (item.children.length > 0) return { ...item, children: update(item.children) }
              return item
           })
        }
        return update(prev)
     })
  }

  const handleAddComponent = (type: ComponentType) => {
    const newId = `comp-${Date.now()}`
    let initialContent: any = { text: 'Neues Element' }
    let initialStyles: React.CSSProperties = { padding: '10px' }

    if (type === 'heading') {
      initialContent = { text: 'Neue Überschrift' }
      initialStyles = { fontSize: '2rem', fontWeight: 'bold' }
    } else if (type === 'button') {
      initialContent = { text: 'Klick mich', url: '#' }
      initialStyles = { backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '0.375rem', display: 'inline-block' }
    } else if (type === 'columns') {
      initialContent = {}
      // Columns handled via children, will initialize empty or with placeholder containers
    } else if (type === 'image') {
      initialContent = { src: 'https://placehold.co/600x400', alt: 'Placeholder Image' }
    }

    const newComponent: EditorComponent = {
      id: newId,
      type,
      content: initialContent,
      styles: { ...initialStyles, marginBottom: '1rem' },
      children: []
    }
    
    // Add to currently selected container if one is selected, else root
    // For simplicity, adding to root or adding 'inside' if selected is complex. 
    // Let's add to Root for now, users can drag in.
    setComponents([...components, newComponent])
    setSelectedId(newId)
  }

  const handleDeleteComponent = (id: string) => {
     setComponents(prev => {
        const deleteRecursive = (items: EditorComponent[]): EditorComponent[] => {
           return items.filter(item => item.id !== id).map(item => ({
              ...item,
              children: deleteRecursive(item.children)
           }))
        }
        return deleteRecursive(prev)
     })
    setSelectedId(null)
  }

  // --- Render Logic for Different Components ---
  const renderComponentContent = (component: EditorComponent) => {
    const { type, content, styles, children } = component
    
    // Sortable context strategy for children
    // Only render SortableContext if there are children or it's a "container" type empty or not
    const isContainer = type === 'container' || type === 'columns';
    
    const renderChildren = (childItems: EditorComponent[]) => (
      childItems.length === 0 ? (
         <div className="p-4 border-2 border-dashed border-gray-200 rounded min-h-[50px] flex items-center justify-center text-xs text-muted-foreground w-full">
            Leer
         </div>
      ) : (
        <SortableContext 
          items={childItems.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col w-full min-h-[20px]">
             {childItems.map((child) => (
                <SortableComponent 
                  key={child.id}
                  component={child}
                  isSelected={selectedId === child.id}
                  onSelect={() => setSelectedId(child.id)}
                  renderContent={renderComponentContent}
                />
             ))}
          </div>
        </SortableContext>
      )
    )

    switch (type) {
      case 'heading':
        return <h2 style={styles}>{content.text}</h2>
      case 'text':
        return <p style={styles}>{content.text}</p>
      case 'button':
        return <a href={content.url || '#'} style={{ ...styles, textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>{content.text}</a>
      case 'image':
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={content.src} alt={content.alt} style={{ ...styles, maxWidth: '100%', height: 'auto' }} />
      case 'container':
        // Ensure container has valid drop zone properties
        return (
          <div style={{ ...styles, border: '1px solid #eee', minHeight: '50px', padding: '10px' }}>
            {content.text && <div className="mb-2 text-sm text-gray-500">{content.text}</div>}
            {renderChildren(children)}
          </div>
        )
      case 'columns':
        // Simplified column logic: 2 columns, split children evenly or use dedicated children?
        // For true drag and drop into specific columns, we'd need a separate data structure for "left" and "right".
        // With current single "children" array, we can just render them in a grid, acting as a flex wrap container.
        // OR we split the children array in half for display (but dnd kit might get confused).
        // Best approach for single-list dnd-kit: Render as Flex Wrap or Grid
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={styles}>
             {/* Note: This simplistic approach puts all children in one sortable list, but styled as grid. 
                 Real multi-column DND usually requires independent lists for each column.
                 For this demo "Multinesting", the 'container' type is the best showcase.
             */}
             <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-2 block w-full text-center border-b pb-1">Spalten-Container (Alle Elemente)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* We map manually here to preserve the grid layout for children? 
                      No, SortableContext expects a direct list. 
                      If we want visually 2 columns, we can just style the CSS Grid on the container 
                  */}
                  {/* Actually, let's just render the shared list. CSS Grid on the wrapper will handle layout if items are blocks. */}
                  {renderChildren(children)}
                </div>
             </div>
          </div>
        )
      default:
        return <div style={styles}>Unknown Component</div>
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="max-h-screen flex flex-col overflow-hidden">
        <SiteHeader />
        <div className="flex flex-1 flex-col bg-background text-foreground overflow-hidden">
          {/* --- Top Bar --- */}
          <header className="flex h-14 items-center justify-between border-b px-4 bg-card shrink-0">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg">Theme Editor</div>
              <Badge variant="outline" className="font-mono">{themeId}</Badge>
            </div>
            
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md">
              <Button 
                variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setDeviceMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button 
                variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setDeviceMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button 
                variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setDeviceMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Redo className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Speichern
              </Button>
            </div>
          </header>

          {/* --- Main Workspace --- */}
          <div className="flex flex-1 overflow-hidden">
            
            {/* --- Left Sidebar (Tools) --- */}
            <aside className="w-64 border-r bg-muted/10 flex flex-col overflow-y-auto">
              <Tabs defaultValue="add" className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b">
                  <TabsList className="w-full">
                    <TabsTrigger value="add" className="flex-1">Add</TabsTrigger>
                    <TabsTrigger value="layers" className="flex-1">Layers</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="add" className="flex-1 p-4 m-0">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">Basics</h3>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <ToolButton icon={<Type />} label="Text" onClick={() => handleAddComponent('text')} />
                    <ToolButton icon={<Heading />} label="Heading" onClick={() => handleAddComponent('heading')} />
                    <ToolButton icon={<ImageIcon />} label="Image" onClick={() => handleAddComponent('image')} />
                    <ToolButton icon={<MousePointer2 />} label="Button" onClick={() => handleAddComponent('button')} />
                  </div>
                  
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4">Layout</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <ToolButton icon={<Box />} label="Container" onClick={() => handleAddComponent('container')} />
                    <ToolButton icon={<Columns />} label="2 Spalten" onClick={() => handleAddComponent('columns')} />
                  </div>
                </TabsContent>
                
                <TabsContent value="layers" className="flex-1 p-4 m-0">
                   {/* Simplified Layer View for Tree - recursive? For now flat for root items */}
                   <div className="text-xs text-muted-foreground mb-2">Hierarchie (Root)</div>
                  <div className="space-y-1">
                    {components.map((c, i) => (
                      <div 
                        key={c.id}
                        className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:bg-muted ${selectedId === c.id ? 'bg-accent text-accent-foreground' : ''}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        {c.type === 'heading' && <Heading className="h-4 w-4 shrink-0" />}
                        {c.type === 'text' && <Type className="h-4 w-4 shrink-0" />}
                        {c.type === 'button' && <MousePointer2 className="h-4 w-4 shrink-0" />}
                        {c.type === 'image' && <ImageIcon className="h-4 w-4 shrink-0" />}
                        {c.type === 'columns' && <Columns className="h-4 w-4 shrink-0" />}
                         {c.type === 'container' && <Box className="h-4 w-4 shrink-0" />}
                        
                        <span className="truncate flex-1">
                           {c.type} {c.content.text ? `- ${c.content.text.substring(0, 10)}...` : ''}
                           {c.children.length > 0 && ` (${c.children.length})`}
                        </span>
                        <Trash2 
                           className="h-3 w-3 hover:text-red-500 opacity-0 group-hover:opacity-100" 
                           onClick={(e) => { e.stopPropagation(); handleDeleteComponent(c.id) }}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </aside>

            {/* --- Center Canvas --- */}
            <main 
              className="flex-1 bg-muted/20 relative flex flex-col items-center p-8 overflow-y-auto"
              onClick={() => setSelectedId(null)}
            >
              <div className="text-xs text-muted-foreground mb-4">
                 Tipp: Ziehe Elemente über Container, um sie zu verschachteln.
              </div>

               <div 
                 className={`bg-white shadow-sm border min-h-[800px] transition-all duration-300 relative pb-20
                   ${deviceMode === 'mobile' ? 'w-[375px]' : deviceMode === 'tablet' ? 'w-[768px]' : 'w-full max-w-5xl'} 
                 `}
                 style={{
                   transformOrigin: 'top center',
                 }}
               >
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={components.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="p-8 min-h-full flex flex-col">
                        {components.length === 0 && (
                           <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4 min-h-[200px]">
                              <Layout className="w-12 h-12 mb-2 opacity-20" />
                              <p>Seite ist leer</p>
                              <Button variant="link" onClick={() => handleAddComponent('heading')}>Überschrift hinzufügen</Button>
                           </div>
                        )}
                        {components.map((comp) => (
                           <SortableComponent 
                             key={comp.id}
                             component={comp}
                             isSelected={selectedId === comp.id}
                             onSelect={() => setSelectedId(comp.id)}
                             renderContent={renderComponentContent}
                           />
                        ))}
                      </div>
                    </SortableContext>
                    
                    <DragOverlay>
                        {activeDragId ? (
                           <div className="p-4 bg-white border border-blue-500 shadow-lg opacity-80 rounded">
                              Wird verschoben...
                           </div>
                        ) : null}
                    </DragOverlay>

                  </DndContext>
               </div>
            </main>

            {/* --- Right Sidebar (Properties) --- */}
            <aside className="w-80 border-l bg-card flex flex-col overflow-y-auto">
              {selectedComponent ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
                    <span className="font-semibold text-sm">Eigenschaften</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteComponent(selectedComponent.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="p-4 space-y-6">
                    
                    {/* Dynamic Content Fields based on Type */}
                    <div className="space-y-3">
                      <Label className="uppercase text-xs font-bold text-muted-foreground block mb-2">Inhalt</Label>
                      
                      {(selectedComponent.type === 'heading' || selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
                        <div className="space-y-2">
                           <Label>Text</Label>
                           <Textarea 
                             value={selectedComponent.content.text || ''} 
                             onChange={(e) => handleUpdateContent(selectedComponent.id, 'text', e.target.value)}
                             rows={selectedComponent.type === 'text' ? 5 : 2}
                           />
                        </div>
                      )}

                      {selectedComponent.type === 'button' && (
                        <div className="space-y-2">
                           <Label>Link URL</Label>
                           <Input 
                             value={selectedComponent.content.url || ''} 
                             onChange={(e) => handleUpdateContent(selectedComponent.id, 'url', e.target.value)}
                             placeholder="https://..."
                           />
                        </div>
                      )}

                      {selectedComponent.type === 'image' && (
                        <div className="space-y-2">
                           <Label>Bild URL</Label>
                           <Input 
                             value={selectedComponent.content.src || ''} 
                             onChange={(e) => handleUpdateContent(selectedComponent.id, 'src', e.target.value)}
                           />
                           <Label>Alt Text</Label>
                           <Input 
                             value={selectedComponent.content.alt || ''} 
                             onChange={(e) => handleUpdateContent(selectedComponent.id, 'alt', e.target.value)}
                           />
                        </div>
                      )}

                      {selectedComponent.type === 'columns' && (
                         <div className="space-y-4">
                            <div className="space-y-2">
                               <Label>Spalte 1 Text</Label>
                               <Textarea 
                                 value={selectedComponent.content.col1Text || ''} 
                                 onChange={(e) => handleUpdateContent(selectedComponent.id, 'col1Text', e.target.value)}
                               />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                               <Label>Spalte 2 Text</Label>
                               <Textarea 
                                 value={selectedComponent.content.col2Text || ''} 
                                 onChange={(e) => handleUpdateContent(selectedComponent.id, 'col2Text', e.target.value)}
                               />
                            </div>
                         </div>
                      )}
                    </div>
                    
                    <Separator />

                    {/* Styling Section */}
                    <div className="space-y-4">
                      <Label className="uppercase text-xs font-bold text-muted-foreground block">Design</Label>
                      
                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                           <Label className="text-xs">Schriftgröße</Label>
                           <Input 
                             value={selectedComponent.styles.fontSize || ''} 
                             onChange={(e) => handleUpdateStyles(selectedComponent.id, { fontSize: e.target.value })} 
                             placeholder="z.B. 16px"
                           />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Farbe</Label>
                           <div className="flex gap-1">
                             <input 
                               type="color" 
                               className="w-8 h-9 p-0 border rounded cursor-pointer"
                               value={(selectedComponent.styles.color as string) || '#000000'}
                               onChange={(e) => handleUpdateStyles(selectedComponent.id, { color: e.target.value })}
                             />
                           </div>
                         </div>
                      </div>

                      <div className="space-y-1">
                         <Label className="text-xs">Ausrichtung</Label>
                         <div className="flex bg-muted rounded-md p-1 gap-1">
                            {['left', 'center', 'right', 'justify'].map((align) => (
                              <button
                                key={align}
                                className={`flex-1 p-1 rounded text-xs ${selectedComponent.styles.textAlign === align ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                                onClick={() => handleUpdateStyles(selectedComponent.id, { textAlign: align as any })}
                              >
                                {align === 'left' ? 'L' : align === 'center' ? 'C' : align === 'right' ? 'R' : 'J'}
                              </button>
                            ))}
                         </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                           <Label className="text-xs">Margin Unten</Label>
                           <Input 
                             value={selectedComponent.styles.marginBottom || ''} 
                             onChange={(e) => handleUpdateStyles(selectedComponent.id, { marginBottom: e.target.value })} 
                             placeholder="20px"
                           />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-xs">Padding</Label>
                           <Input 
                             value={selectedComponent.styles.padding || ''} 
                             onChange={(e) => handleUpdateStyles(selectedComponent.id, { padding: e.target.value })} 
                             placeholder="10px"
                           />
                         </div>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                   <Settings className="h-10 w-10 mb-2 opacity-20" />
                   <p className="text-sm">Wähle ein Element aus, um Eigenschaften zu sehen.</p>
                </div>
              )}
            </aside>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline" 
      className="h-20 flex flex-col gap-2 items-center justify-center hover:border-blue-500 hover:text-blue-500 transition-colors"
      onClick={onClick}
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="text-xs">{label}</span>
    </Button>
  )
}
