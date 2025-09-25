import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ExternalLink, Users, MapPin, Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface EventCreator {
  id: string;
  displayName: string;
  description: string;
  xProfile: string;
  imageUrl: string;
}

interface EventData {
  id: string;
  metaData: {
    dappLink?: string;
    duration: number;
    startTime: string;
    priority?: number;
    creatorIds?: string[];
    creators?: EventCreator[];
  };
  presentation: {
    cardSubTitle: string;
    cardTitle: string;
    description?: string;
    image: string;
    highlightImage?: string;
    link: {
      isInternal: boolean;
      url: string;
    };
    liveInDurationText: string;
    closedText: string;
  };
}

const eventData: EventData[] = [
  {
    "id": "499795ec-a6d5-4c3a-abe5-17c1547796c3",
    "metaData": {
      "dappLink": "",
      "duration": 7200000,
      "startTime": "2025-10-15T23:30:00.000Z",
      "priority": -33,
      "creatorIds": ["c9851287-ee3d-4a84-b299-b0175a5f2ffa"],
      "creators": [{
        "id": "c9851287-ee3d-4a84-b299-b0175a5f2ffa",
        "displayName": "ApersonLyeque",
        "description": "Host and craftsman, ApersonLyeque has been building in the Aptos Ecosystem since mainnet.",
        "xProfile": "https://x.com/ApersonLyeque",
        "imageUrl": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/a786b5cc-48e7-4dfb-187e-d704cb682800/small100x100"
      }]
    },
    "presentation": {
      "cardSubTitle": "Hosted by ApersonLyeque",
      "cardTitle": "Taco bout it Tues",
      "description": "Join us for a casual Tuesday night discussion about all things Aptos ecosystem. From new projects to community updates, we'll cover it all in a relaxed, friendly environment.",
      "image": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/a786b5cc-48e7-4dfb-187e-d704cb682800/small100x100",
      "link": {
        "isInternal": false,
        "url": "https://x.com/i/spaces/1ynKOMeWkrlJR"
      },
      "liveInDurationText": "Live!",
      "closedText": "Ended"
    }
  },
  {
    "id": "801d2cf5-fe61-4924-a2f7-bf167ed28e30",
    "metaData": {
      "dappLink": "",
      "duration": 7200000,
      "startTime": "2025-10-17T23:30:00.000Z",
      "priority": -25,
      "creatorIds": ["c9851287-ee3d-4a84-b299-b0175a5f2ffa"],
      "creators": [{
        "id": "c9851287-ee3d-4a84-b299-b0175a5f2ffa",
        "displayName": "ApersonLyeque",
        "description": "Host and craftsman, ApersonLyeque has been building in the Aptos Ecosystem since mainnet.",
        "xProfile": "https://x.com/ApersonLyeque",
        "imageUrl": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/a786b5cc-48e7-4dfb-187e-d704cb682800/small100x100"
      }]
    },
    "presentation": {
      "cardSubTitle": "Hosted by ApersonLyeque",
      "cardTitle": "Not so Thirsty Thurs",
      "description": "Thursday evening vibes with the Aptos community. Less thirsty, more discussion about the latest developments in the ecosystem.",
      "image": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/a786b5cc-48e7-4dfb-187e-d704cb682800/small100x100",
      "link": {
        "isInternal": false,
        "url": "https://x.com/i/spaces/1MnxnPbLaQBGO"
      },
      "liveInDurationText": "Live!",
      "closedText": "Ended"
    }
  },
  {
    "id": "3fc122e6-7064-456d-8585-7221da968611",
    "metaData": {
      "dappLink": "",
      "duration": 7200000,
      "startTime": "2025-10-20T23:30:00.000Z",
      "creatorIds": ["0f6f1d11-2b13-46d1-a4d5-09f252f80997", "2e88257b-a58c-4c62-b87b-771e9d454df4"],
      "creators": [{
        "id": "0f6f1d11-2b13-46d1-a4d5-09f252f80997",
        "displayName": "Atreyu",
        "description": "Founder & Co-host of The Aptos After Dark space, Pixel Pirates (NFT Collection).",
        "xProfile": "https://x.com/hiAtreyu_",
        "imageUrl": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/8dda7c94-37da-4260-9dc1-21cfb5eb9a00/small100x100"
      }]
    },
    "presentation": {
      "cardSubTitle": "Sneezy & Atreyu Host (Ep 75)",
      "cardTitle": "Aptos After Dark",
      "description": "The ultimate late-night Aptos community hangout. Join Sneezy and Atreyu for deep dives into projects, alpha calls, and community discussions.",
      "image": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/225e3011-c4e7-4903-76d6-734e9a214100/small100x100",
      "link": {
        "isInternal": false,
        "url": "https://x.com/i/spaces/1OyKAjRAgdbGb"
      },
      "liveInDurationText": "Live!",
      "closedText": "Ended"
    }
  },
  {
    "id": "55a7a18d-115e-48a3-ac92-93334201a866",
    "metaData": {
      "dappLink": "https://wapal.io/",
      "duration": 604800000,
      "startTime": "2025-10-25T16:00:00.000Z",
      "priority": -32,
      "creators": []
    },
    "presentation": {
      "cardSubTitle": "Roger (on Aptos)",
      "cardTitle": "Mint: Wapal",
      "description": "Exclusive NFT mint featuring Roger on Aptos. Limited collection available on Wapal marketplace.",
      "image": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/2135a818-a608-4bdd-ce3a-33334a7e6c00/small100x100",
      "link": {
        "isInternal": true,
        "url": "https://launchpad.wapal.io/nft/rogeronaptos"
      },
      "liveInDurationText": "Mint!",
      "closedText": "Mint!"
    }
  },
  {
    "id": "upcoming-hackathon-1",
    "metaData": {
      "dappLink": "https://aptoslabs.com/hackathon",
      "duration": 259200000,
      "startTime": "2025-11-01T00:00:00.000Z",
      "priority": -40,
      "creators": []
    },
    "presentation": {
      "cardSubTitle": "Aptos Foundation",
      "cardTitle": "Aptos Global Hackathon 2025",
      "description": "Join developers worldwide in building the next generation of dApps on Aptos. $500K in prizes and mentorship from Aptos Labs.",
      "image": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/45994284-1198-4a77-d8d4-00b410f00900/small100x100",
      "link": {
        "isInternal": false,
        "url": "https://aptoslabs.com/hackathon"
      },
      "liveInDurationText": "Register!",
      "closedText": "Register!"
    }
  },
  {
    "id": "defi-summit-1",
    "metaData": {
      "dappLink": "",
      "duration": 28800000,
      "startTime": "2025-10-30T14:00:00.000Z",
      "priority": -35,
      "creators": []
    },
    "presentation": {
      "cardSubTitle": "DeFi on Aptos",
      "cardTitle": "Aptos DeFi Summit",
      "description": "Explore the future of decentralized finance on Aptos. Top DeFi protocols, yield farming strategies, and new opportunities.",
      "image": "https://imagedelivery.net/1v0lk1OFEOmesBikJtB8QQ/8fbd8515-075f-4835-3b75-5ed054f73100/small100x100",
      "link": {
        "isInternal": false,
        "url": "https://x.com/i/spaces/defi-summit"
      },
      "liveInDurationText": "Join!",
      "closedText": "Join!"
    }
  }
];

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'live' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sort events by start time
    const sortedEvents = [...eventData].sort((a, b) => 
      new Date(a.metaData.startTime).getTime() - new Date(b.metaData.startTime).getTime()
    );
    setEvents(sortedEvents);
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.presentation.cardTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.presentation.cardSubTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.presentation.description && event.presentation.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (selectedFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.metaData.startTime);
        const eventEndDate = new Date(eventDate.getTime() + event.metaData.duration);
        
        switch (selectedFilter) {
          case 'upcoming':
            return eventDate > now;
          case 'live':
            return eventDate <= now && eventEndDate > now;
          case 'past':
            return eventEndDate <= now;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, selectedFilter, currentTime]);

  const formatEventTime = (startTime: string) => {
    const eventDate = new Date(startTime);
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    
    if (timeDiff < 0) return 'Started';
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (startTime: string) => {
    return new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (startTime: string, duration: number) => {
    const now = new Date();
    const eventDate = new Date(startTime);
    const eventEndDate = new Date(eventDate.getTime() + duration);
    
    if (now >= eventDate && now < eventEndDate) return { status: 'live', color: 'bg-green-500', text: 'Live' };
    if (eventDate > now) {
      const timeDiff = eventDate.getTime() - now.getTime();
      if (timeDiff < 24 * 60 * 60 * 1000) return { status: 'soon', color: 'bg-orange-500', text: 'Soon' };
      return { status: 'upcoming', color: 'bg-blue-500', text: 'Upcoming' };
    }
    return { status: 'past', color: 'bg-gray-500', text: 'Ended' };
  };

  const handleEventClick = (event: EventData) => {
    window.open(event.presentation.link.url, '_blank');
  };

  const EventCard: React.FC<{ event: EventData; isListView?: boolean }> = ({ event, isListView = false }) => {
    const eventStatus = getEventStatus(event.metaData.startTime, event.metaData.duration);
    
    return (
      <Card 
        className={`bg-gray-900/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer hover:border-gray-600 group ${
          isListView ? 'flex-row' : ''
        }`}
        onClick={() => handleEventClick(event)}
      >
        <div className={`relative ${isListView ? 'flex items-center p-4 gap-4' : 'p-6'}`}>
          {/* Event Image */}
          <div className="relative flex-shrink-0">
            <img
              src={event.presentation.image}
              alt={event.presentation.cardTitle}
              className={`object-cover rounded-lg ${isListView ? 'w-16 h-16' : 'w-20 h-20 mb-4'}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMjQgMTJDMTcuMzcyNiAxMiAxMiAxNy4zNzI2IDEyIDI0QzEyIDMwLjYyNzQgMTcuMzcyNiAzNiAyNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyWk0yNiAzMEgyMlYyNkgyNlYzMFpNMjYgMjJIMjJWMThIMjZWMjJaIiBmaWxsPSIjOUI5QkE0Ii8+Cjwvc3ZnPgo=';
              }}
            />
            <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${eventStatus.color}`} />
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                  {event.presentation.cardTitle}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {event.presentation.cardSubTitle}
                </p>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-1 ${
                    eventStatus.status === 'live' 
                      ? 'border-green-500 text-green-400' 
                      : eventStatus.status === 'soon'
                      ? 'border-orange-500 text-orange-400'
                      : eventStatus.status === 'upcoming'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-gray-500 text-gray-400'
                  }`}
                >
                  {eventStatus.text}
                </Badge>
                <ExternalLink className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>

            {/* Event Description */}
            {event.presentation.description && (
              <p className="text-gray-300 text-sm mb-4" style={{
                display: '-webkit-box',
                WebkitLineClamp: isListView ? 2 : 3,
                WebkitBoxOrient: 'vertical' as any,
                overflow: 'hidden'
              }}>
                {event.presentation.description}
              </p>
            )}

            {/* Event Details */}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.metaData.startTime)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatEventTime(event.metaData.startTime)}</span>
              </div>
              
              {event.metaData.creators && event.metaData.creators.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event.metaData.creators[0].displayName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Aptos Events</h1>
          <p className="text-gray-400">Discover upcoming events, spaces, and community gatherings in the Aptos ecosystem</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="p-2"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="p-2"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'upcoming', 'live', 'past'] as const).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className="capitalize"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Events Grid/List */}
      {filteredEvents.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-400">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Check back later for new events!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              isListView={viewMode === 'list'} 
            />
          ))}
        </div>
      )}

      {/* Stats */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {events.filter(e => getEventStatus(e.metaData.startTime, e.metaData.duration).status === 'upcoming').length}
              </div>
              <div>Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {events.filter(e => getEventStatus(e.metaData.startTime, e.metaData.duration).status === 'live').length}
              </div>
              <div>Live</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {events.length}
              </div>
              <div>Total Events</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsPage;