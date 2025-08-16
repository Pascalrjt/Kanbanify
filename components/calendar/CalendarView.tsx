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
        
        return {
          id: card.id,
          title: card.title,
          start: dueDate,
          end: dueDate,
          resource: card,
          priority: card.priority || 'medium',
          listTitle: list?.title || 'Unknown List'
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
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high':
          return 'bg-red-500 border-red-600'
        case 'medium':
          return 'bg-yellow-500 border-yellow-600'
        case 'low':
          return 'bg-green-500 border-green-600'
        default:
          return 'bg-gray-500 border-gray-600'
      }
    }

    const isOverdue = new Date(event.start) < new Date() && event.resource.status !== 'completed'

    return (
      <div className="calendar-event">
        <div className={`px-2 py-1 rounded text-white text-xs font-medium ${getPriorityColor(event.priority)} ${
          isOverdue ? 'ring-2 ring-red-300 ring-opacity-50' : ''
        }`}>
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
    const getPriorityStyle = (priority: string) => {
      switch (priority) {
        case 'high':
          return {
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            color: 'white'
          }
        case 'medium':
          return {
            backgroundColor: '#f59e0b',
            borderColor: '#d97706',
            color: 'white'
          }
        case 'low':
          return {
            backgroundColor: '#10b981',
            borderColor: '#059669',
            color: 'white'
          }
        default:
          return {
            backgroundColor: '#6b7280',
            borderColor: '#4b5563',
            color: 'white'
          }
      }
    }

    return {
      style: getPriorityStyle(event.priority)
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