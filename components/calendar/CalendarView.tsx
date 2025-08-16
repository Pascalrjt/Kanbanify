"use client"

import { useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import { useBoardStore } from '@/store/boardStore'
import { Card as CardType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { CardDetailModal } from '@/components/modals/CardDetailModal'
import { useState } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: CardType
  priority: 'low' | 'medium' | 'high'
  listTitle: string
  listColor: string
}

interface CalendarViewProps {
  height?: number | string
}

export function CalendarView({ height }: CalendarViewProps) {
  const { cards, lists } = useBoardStore()
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState<any>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Transform cards with due dates into calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return cards
      .filter(card => card.dueDate)
      .map(card => {
        const list = lists.find(l => l.id === card.listId)
        const dueDate = new Date(card.dueDate!)
        
        // For week/day views, make events span 1 hour
        const endDate = new Date(dueDate)
        endDate.setHours(endDate.getHours() + 1)
        
        return {
          id: card.id,
          title: card.title,
          start: dueDate,
          end: endDate,
          resource: card,
          priority: card.priority || 'medium',
          listTitle: list?.title || 'Unknown List',
          listColor: list?.color || '#f1f5f9'
        }
      })
  }, [cards, lists])

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedCard(event.resource)
    setIsCardModalOpen(true)
  }, [])

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const getListColorClass = (listColor: string) => {
      // Convert hex color to RGB for better contrast calculation
      const hex = listColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      // Calculate brightness to determine text color
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      const textColor = brightness > 128 ? 'text-gray-800' : 'text-white'
      
      return textColor
    }

    const getPriorityBorderColor = (priority: string) => {
      switch (priority) {
        case 'high':
          return '#dc2626' // red-600
        case 'medium':
          return '#d97706' // yellow-600
        case 'low':
          return '#059669' // green-600
        default:
          return '#4b5563' // gray-600
      }
    }

    const isOverdue = new Date(event.start) < new Date() && event.resource.status !== 'completed'

    return (
      <div className="calendar-event">
        <div 
          className={`px-2 py-1 rounded text-xs font-medium border-2 ${getListColorClass(event.listColor)} ${
            isOverdue ? 'ring-2 ring-red-300 ring-opacity-50' : ''
          }`}
          style={{ 
            backgroundColor: event.listColor,
            borderColor: getPriorityBorderColor(event.priority)
          }}
        >
          <div className="truncate">
            {isOverdue && '⚠️ '}
            {event.title}
            {event.resource.status === 'completed' && ' ✓'}
          </div>
          <div className="text-xs opacity-80">{event.listTitle}</div>
        </div>
      </div>
    )
  }

  // Handle view and navigation changes
  const handleNavigate = useCallback((newDate: Date, view?: any, action?: string) => {
    console.log('Navigate:', action, newDate, view)
    setCurrentDate(newDate)
  }, [])

  const handleViewChange = useCallback((view: any) => {
    console.log('View change:', view)
    setCurrentView(view)
  }, [])

  // Custom toolbar component with proper react-big-calendar integration
  const CustomToolbar = useCallback((props: any) => {
    const { label, onNavigate, onView, view } = props
    
    console.log('Toolbar props:', { label, view, onNavigate: typeof onNavigate, onView: typeof onView })

    return (
      <div className="mb-2 p-2 bg-card border rounded-lg">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  console.log('Clicking PREV')
                  onNavigate('PREV')
                }}
                className="px-2 py-1 bg-background border rounded hover:bg-muted transition-colors text-sm"
              >
                ←
              </button>
              <button
                onClick={() => {
                  console.log('Clicking TODAY')
                  onNavigate('TODAY')
                }}
                className="px-2 py-1 bg-background border rounded hover:bg-muted transition-colors text-xs"
              >
                Today
              </button>
              <button
                onClick={() => {
                  console.log('Clicking NEXT')
                  onNavigate('NEXT')
                }}
                className="px-2 py-1 bg-background border rounded hover:bg-muted transition-colors text-sm"
              >
                →
              </button>
            </div>
            
            <h2 className="text-sm font-semibold truncate flex-1 text-center">{label}</h2>
          </div>
          
          <div className="grid grid-cols-4 gap-1">
            {['month', 'week', 'day', 'agenda'].map(viewName => (
              <button
                key={viewName}
                onClick={() => {
                  console.log(`Clicking view: ${viewName}`)
                  onView(viewName)
                }}
                className={`px-1 py-1 rounded capitalize transition-colors text-xs ${
                  view === viewName 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background border hover:bg-muted'
                }`}
              >
                {viewName}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }, [])

  // Custom day prop getter for styling
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date()
    const isToday = moment(date).isSame(today, 'day')
    const isPast = moment(date).isBefore(today, 'day')
    
    return {
      className: `${
        isToday ? 'rbc-today' : ''
      } ${
        isPast ? 'rbc-past-day' : ''
      }`,
      style: {
        backgroundColor: isToday ? 'rgba(59, 130, 246, 0.1)' : undefined,
      }
    }
  }, [])

  // Custom event prop getter for styling
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const getEventStyle = (listColor: string, priority: string) => {
      // Convert hex color to RGB for better contrast calculation
      const hex = listColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      // Calculate brightness to determine text color
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      const textColor = brightness > 128 ? '#374151' : '#ffffff'
      
      // Get priority border color
      const getPriorityBorderColor = (priority: string) => {
        switch (priority) {
          case 'high':
            return '#dc2626' // red-600
          case 'medium':
            return '#d97706' // yellow-600
          case 'low':
            return '#059669' // green-600
          default:
            return '#4b5563' // gray-600
        }
      }
      
      return {
        backgroundColor: listColor,
        borderColor: getPriorityBorderColor(priority),
        color: textColor
      }
    }

    return {
      style: getEventStyle(event.listColor, event.priority)
    }
  }, [])

  // Calculate additional stats
  const today = new Date()
  const overdueEvents = events.filter(event => 
    new Date(event.start) < today && event.resource.status !== 'completed'
  )
  const completedEvents = events.filter(event => 
    event.resource.status === 'completed'
  )
  const upcomingEvents = events.filter(event => 
    new Date(event.start) >= today && event.resource.status !== 'completed'
  )

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border rounded-lg">
        <div className="text-center space-y-2">
          <div className="text-muted-foreground">No cards with due dates found</div>
          <div className="text-sm text-muted-foreground">
            Add due dates to your cards to see them on the calendar
          </div>
        </div>
      </div>
    )
  }

  // Calculate dynamic height
  const calendarHeight = height || 'calc(100vh - 300px)'

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Calendar Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 flex-shrink-0">
        <div className="p-2 bg-card border rounded-lg">
          <div className="text-base lg:text-lg font-bold text-foreground">{events.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="p-2 bg-card border rounded-lg">
          <div className="text-base lg:text-lg font-bold text-red-500">{overdueEvents.length}</div>
          <div className="text-xs text-muted-foreground">Overdue</div>
        </div>
        <div className="p-2 bg-card border rounded-lg">
          <div className="text-base lg:text-lg font-bold text-blue-500">{upcomingEvents.length}</div>
          <div className="text-xs text-muted-foreground">Upcoming</div>
        </div>
        <div className="p-2 bg-card border rounded-lg">
          <div className="text-base lg:text-lg font-bold text-green-500">{completedEvents.length}</div>
          <div className="text-xs text-muted-foreground">Done</div>
        </div>
        <div className="p-2 bg-card border rounded-lg">
          <div className="text-base lg:text-lg font-bold text-red-500">
            {events.filter(e => e.priority === 'high').length}
          </div>
          <div className="text-xs text-muted-foreground">High</div>
        </div>
        <div className="p-2 bg-card border rounded-lg">
          <div className="text-base lg:text-lg font-bold text-yellow-500">
            {events.filter(e => e.priority === 'medium').length}
          </div>
          <div className="text-xs text-muted-foreground">Medium</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card border rounded-lg p-2 lg:p-4 pointer-events-auto relative z-10 flex-1 min-h-0">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: calendarHeight }}
          view={currentView}
          date={currentDate}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent,
          }}
          dayPropGetter={dayPropGetter}
          eventPropGetter={eventPropGetter}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          popup
          popupOffset={30}
          showMultiDayTimes
          step={60}
          timeslots={1}
          formats={{
            dayFormat: 'ddd M/D',
            weekdayFormat: 'ddd',
            monthHeaderFormat: 'MMMM YYYY',
            dayHeaderFormat: 'dddd, MMMM D',
            agendaDateFormat: 'M/D/YYYY',
            agendaTimeFormat: 'h:mm A',
            agendaTimeRangeFormat: ({ start, end }) => 
              `${moment(start).format('h:mm A')} — ${moment(end).format('h:mm A')}`
          }}
          messages={{
            allDay: 'All Day',
            previous: '←',
            next: '→',
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Time',
            event: 'Event',
            noEventsInRange: 'No cards with due dates in this range.',
            showMore: total => `+${total} more`
          }}
        />
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
      />
    </div>
  )
}