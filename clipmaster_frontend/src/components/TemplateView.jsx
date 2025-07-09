import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Star, 
  Edit, 
  Copy, 
  Trash2, 
  Plus,
  Play,
  Grid3X3,
  List,
  Mail,
  MessageSquare,
  FileText,
  Briefcase
} from 'lucide-react'
import apiService from '../services/api'

const TemplateView = ({ searchQuery }) => {
  const [templates, setTemplates] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateVariables, setTemplateVariables] = useState({})
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: 'general',
    tags: []
  })

  // Load templates from API
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTemplates({ user_id: 1 })
      setTemplates(response.items || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      // Fallback to mock data if API fails
      setTemplates([
        {
          id: 1,
          name: "Professional Email",
          content: "Dear {{recipient_name}},\n\nI hope this email finds you well. {{#if urgent}}This is an urgent matter regarding {{subject}}.{{else}}I wanted to reach out regarding {{subject}}.{{/if}}\n\n{{message_body}}\n\nBest regards,\n{{sender_name}}\n{{sender_title}}",
          category: "email",
          tags: ["business", "formal"],
          variables: ["recipient_name", "subject", "message_body", "sender_name", "sender_title", "urgent"],
          is_favorite: true,
          usage_count: 15,
          created_at: "2025-07-06T01:22:09.631821"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'report': return <FileText className="h-4 w-4" />
      default: return <Briefcase className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'sms': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'report': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filter === 'all' || 
      (filter === 'favorites' && template.is_favorite) ||
      (filter !== 'all' && filter !== 'favorites' && template.category === filter)
    
    return matchesSearch && matchesFilter
  })

  const handleUseTemplate = async (template) => {
    setSelectedTemplate(template)
    const initialVariables = {}
    template.variables.forEach(variable => {
      initialVariables[variable] = ''
    })
    setTemplateVariables(initialVariables)
    setIsUseDialogOpen(true)
  }

  const handleGenerateContent = async () => {
    try {
      const response = await apiService.useTemplate(selectedTemplate.id, templateVariables)
      await apiService.copyToClipboard(response.content)
      setIsUseDialogOpen(false)
      console.log('Generated content copied to clipboard')
    } catch (error) {
      console.error('Failed to generate content:', error)
      // Fallback to local processing
      let content = selectedTemplate.content
      
      // Replace variables
      Object.entries(templateVariables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })
      
      // Simple conditional logic processing
      content = content.replace(/{{#if\s+(\w+)}}(.*?){{else}}(.*?){{\/if}}/gs, (match, variable, ifContent, elseContent) => {
        return templateVariables[variable] ? ifContent : elseContent
      })
      
      content = content.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, ifContent) => {
        return templateVariables[variable] ? ifContent : ''
      })
      
      await apiService.copyToClipboard(content)
      setIsUseDialogOpen(false)
    }
  }

  const handleFavorite = async (id) => {
    try {
      await apiService.toggleTemplateFavorite(id)
      setTemplates(templates.map(template => 
        template.id === id ? { ...template, is_favorite: !template.is_favorite } : template
      ))
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      // Fallback to local state update
      setTemplates(templates.map(template => 
        template.id === id ? { ...template, is_favorite: !template.is_favorite } : template
      ))
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiService.deleteTemplate(id)
      setTemplates(templates.filter(template => template.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
      // Fallback to local state update
      setTemplates(templates.filter(template => template.id !== id))
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const templateData = {
        ...newTemplate,
        user_id: 1,
        tags: newTemplate.tags.filter(tag => tag.trim() !== '')
      }
      
      const createdTemplate = await apiService.createTemplate(templateData)
      setTemplates([createdTemplate, ...templates])
      setNewTemplate({ name: '', content: '', category: 'general', tags: [] })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg"></div>
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
          <h2 className="text-2xl font-bold text-foreground">Templates</h2>
          <p className="text-muted-foreground">
            {filteredTemplates.length} templates {searchQuery && `matching "${searchQuery}"`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="all">All Categories</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="report">Reports</option>
            <option value="favorites">Favorites</option>
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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input 
                    id="template-name" 
                    placeholder="Enter template name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <select 
                    id="template-category" 
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="report">Report</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="template-tags">Tags (comma-separated)</Label>
                  <Input 
                    id="template-tags" 
                    placeholder="business, formal, urgent"
                    value={newTemplate.tags.join(', ')}
                    onChange={(e) => setNewTemplate(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-content">Template Content</Label>
                  <Textarea 
                    id="template-content" 
                    placeholder="Enter your template content. Use {{variable}} for dynamic content and {{#if variable}}...{{/if}} for conditional logic."
                    rows={8}
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={!newTemplate.name.trim() || !newTemplate.content.trim()}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms' : 'Create your first template to get started'}
          </p>
        </div>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          }
        `}>
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={getCategoryColor(template.category)}>
                      {getCategoryIcon(template.category)}
                      <span className="ml-1 capitalize">{template.category}</span>
                    </Badge>
                    {template.is_favorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFavorite(template.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Star className={`h-4 w-4 ${template.is_favorite ? 'fill-current text-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-medium text-foreground">{template.name}</h3>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {template.content}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Used {template.usage_count} times</span>
                  <span>{formatDate(template.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Use Template Dialog */}
      <Dialog open={isUseDialogOpen} onOpenChange={setIsUseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Fill in the variables below to generate your content:
              </div>
              
              {selectedTemplate.variables.map((variable) => (
                <div key={variable}>
                  <Label htmlFor={variable} className="capitalize">
                    {variable.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    id={variable}
                    value={templateVariables[variable] || ''}
                    onChange={(e) => setTemplateVariables({
                      ...templateVariables,
                      [variable]: e.target.value
                    })}
                    placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                  />
                </div>
              ))}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateContent}>
                  <Copy className="h-4 w-4 mr-2" />
                  Generate & Copy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TemplateView

