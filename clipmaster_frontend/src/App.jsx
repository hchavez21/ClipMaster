import { useState } from 'react'
import Layout from './components/Layout'
import ClipboardView from './components/ClipboardView'
import TemplateView from './components/TemplateView'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('clipboard')
  const [searchQuery, setSearchQuery] = useState('')

  const renderCurrentView = () => {
    switch (currentView) {
      case 'clipboard':
        return <ClipboardView searchQuery={searchQuery} />
      case 'templates':
        return <TemplateView searchQuery={searchQuery} />
      case 'favorites':
        return <ClipboardView searchQuery={searchQuery} />
      case 'categories':
        return <TemplateView searchQuery={searchQuery} />
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Settings</h2>
            <p className="text-muted-foreground">Settings panel coming soon...</p>
          </div>
        )
      default:
        return <ClipboardView searchQuery={searchQuery} />
    }
  }

  return (
    <Layout 
      currentView={currentView}
      onViewChange={setCurrentView}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {renderCurrentView()}
    </Layout>
  )
}

export default App
