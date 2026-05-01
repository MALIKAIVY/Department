import React, { useState } from 'react';
import { api } from '../../lib/api';
import { CalendarPlus, ChevronLeft, MapPin, AlignLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, PageHeader, Textarea } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

export const ManageEvents: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [publicEvent, setPublicEvent] = useState({
    title: '',
    event_date: '',
    location: '',
    description: '',
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.fetch('/admin/events', {
        method: 'POST',
        body: JSON.stringify(publicEvent)
      });
      toast.success('Upcoming event published to homepage');
      setPublicEvent({
        title: '',
        event_date: '',
        location: '',
        description: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish event');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/dashboard')}
        className="-ml-2 flex items-center gap-2 text-gray-600"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <PageHeader 
        title="Manage Public Events" 
        description="Publish upcoming events to the public landing page" 
      />

      <Card className="max-w-2xl p-8">
        <form onSubmit={handleCreateEvent} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                <CalendarPlus className="h-3 w-3" />
                Event Title
              </label>
              <Input
                placeholder="e.g. Annual Alumni Gala 2026"
                value={publicEvent.title}
                onChange={(e) => setPublicEvent({ ...publicEvent, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Date or Period</label>
                <Input
                  placeholder="e.g. 15th - 17th July 2026"
                  value={publicEvent.event_date}
                  onChange={(e) => setPublicEvent({ ...publicEvent, event_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Location
                </label>
                <Input
                  placeholder="e.g. Main Auditorium / Virtual"
                  value={publicEvent.location}
                  onChange={(e) => setPublicEvent({ ...publicEvent, location: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-2">
                <AlignLeft className="h-3 w-3" />
                Description
              </label>
              <Textarea
                placeholder="Short public description of the event..."
                value={publicEvent.description}
                onChange={(e) => setPublicEvent({ ...publicEvent, description: e.target.value })}
                rows={5}
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isCreating} 
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700"
            >
              {isCreating ? 'Publishing Event...' : 'Publish Event to Homepage'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
