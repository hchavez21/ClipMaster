import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Pin, 
  Copy, 
  Trash2, 
  Image, 
  Link, 
  FileText, 
  Grid3X3, 
  List,
  Filter,
  Plus,
  Clipboard
} from 'lucide-react'
import apiService from '../services/api'

const ClipboardView = ({ searchQuery }) => {
  const [items, setItems] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    content: '',
    title: '',
    content_type: 'text'
  })

  // Load clipboard items from API
  useEffect(() => {
    loadClipboardItems()
  }, [])

  const loadClipboardItems = async () => {
    try {
      setLoading(true)
      const response = await apiService.getClipboardItems({ user_id: 1 })
      setItems(response.items || [])
    } catch (error) {
      console.error('Failed to load clipboard items:', error)
      // Fallback to mock data if API fails
      setItems([
        {
          id: 1,
          content: "Hello World! This is a sample text that was copied to the clipboard.",
          content_type: "text",
          title: "Sample Text",
          is_pinned: true,
          created_at: "2025-07-06T01:22:09.631821"
        },
        {
          id: 2,
          content: "https://github.com/user/repo",
          content_type: "link",
          title: "GitHub Repository",
          is_pinned: false,
          created_at: "2025-07-06T01:20:15.123456"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />
      case 'link': return <Link className="h-4 w-4" />
      case 'file': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getContentTypeColor = (type) => {
    switch (type) {
      case 'image': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'link': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'file': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'pinned' && item.is_pinned) ||
      (filter !== 'all' && filter !== 'pinned' && item.content_type === filter)
    
    return matchesSearch && matchesFilter
  })

  const handleCopy = async (content) => {
    try {
      const success = await apiService.copyToClipboard(content)
      if (success) {
        console.log('Copied to clipboard')
        // In a real app, show a toast notification
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePin = async (id) => {
    try {
      await apiService.toggleClipboardItemPin(id)
      setItems(items.map(item => 
        item.id === id ? { ...item, is_pinned: !item.is_pinned } : item
      ))
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      // Fallback to local state update
      setItems(items.map(item => 
        item.id === id ? { ...item, is_pinned: !item.is_pinned } : item
      ))
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiService.deleteClipboardItem(id)
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Failed to delete item:', error)
      // Fallback to local state update
      setItems(items.filter(item => item.id !== id))
    }
  }

  const handleAddItem = async () => {
    try {
      const contentType = await apiService.detectContentType(newItem.content)
      const itemData = {
        ...newItem,
        content_type: contentType,
        user_id: 1
      }
      
      const createdItem = await apiService.createClipboardItem(itemData)
      setItems([createdItem, ...items])
      setNewItem({ content: '', title: '', content_type: 'text' })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const handleReadClipboard = async () => {
    try {
      const content = await apiService.readFromClipboard()
      if (content) {
        setNewItem(prev => ({ ...prev, content }))
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clipboard History</h2>
          <p className="text-muted-foreground">
            {filteredItems.length} items {searchQuery && `matching "${searchQuery}"`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="image">Images</option>
            <option value="link">Links</option>
            <option value="file">Files</option>
            <option value="pinned">Pinned</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Clipboard Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item-title">Title (Optional)</Label>
                  <Input 
                    id="item-title" 
                    placeholder="Enter a title for this item"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="item-content">Content</Label>
                  <div className="flex gap-2 mb-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleReadClipboard}
                    >
                      <Clipboard className="h-4 w-4 mr-2" />
                      Paste from Clipboard
                    </Button>
                  </div>
                  <Textarea 
                    id="item-content" 
                    placeholder="Enter or paste your content here"
                    rows={6}
                    value={newItem.content}
                    onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem} disabled={!newItem.content.trim()}>
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Clipboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No clipboard items found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms' : 'Start copying items to see them here'}
          </p>
        </div>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
            : 'space-y-3'
          }
        `}>
          {filteredItems.map((item) => (
            <Card key={item.id} className={`
              group hover:shadow-md transition-shadow duration-200
              ${item.is_pinned ? 'ring-2 ring-primary/20' : ''}
              ${viewMode === 'list' ? 'flex-row' : ''}
            `}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getContentTypeColor(item.content_type)}>
                      {getContentTypeIcon(item.content_type)}
                      <span className="ml-1 capitalize">{item.content_type}</span>
                    </Badge>
                    {item.is_pinned && (
                      <Pin className="h-4 w-4 text-primary fill-current" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePin(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Pin className={`h-4 w-4 ${item.is_pinned ? 'fill-current text-primary' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.content)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {item.title && (
                  <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className={`
                  text-sm text-muted-foreground mb-3
                  ${viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'}
                `}>
                  {item.content}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClipboardView

