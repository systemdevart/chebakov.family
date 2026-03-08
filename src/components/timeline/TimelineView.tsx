import { useMemo } from 'react';
import { User, Calendar } from 'lucide-react';
import { useFamilyStore } from '../../store/familyStore';
import { getShortName, getYearFromDate } from '../../utils/helpers';
import type { FamilyMember } from '../../types/family';
import './TimelineView.css';

interface TimelineEvent {
  year: number;
  type: 'birth' | 'death' | 'event';
  member: FamilyMember;
  description: string;
}

export default function TimelineView() {
  const { data, setSelectedMember, openDrawer } = useFamilyStore();

  const events = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    data.members.forEach((member) => {
      if (member.birthDate) {
        allEvents.push({
          year: parseInt(getYearFromDate(member.birthDate)),
          type: 'birth',
          member,
          description: `Родился${member.gender === 'female' ? 'ась' : ''} ${getShortName(member)}`,
        });
      }

      if (member.deathDate) {
        allEvents.push({
          year: parseInt(getYearFromDate(member.deathDate)),
          type: 'death',
          member,
          description: `Умер${member.gender === 'female' ? 'ла' : ''} ${getShortName(member)}`,
        });
      }

      member.events?.forEach((event) => {
        allEvents.push({
          year: parseInt(getYearFromDate(event.date)),
          type: 'event',
          member,
          description: event.title,
        });
      });
    });

    return allEvents.sort((a, b) => a.year - b.year);
  }, [data.members]);

  const decades = useMemo(() => {
    if (events.length === 0) return [];

    const minYear = Math.floor(events[0].year / 10) * 10;
    const maxYear = Math.ceil(events[events.length - 1].year / 10) * 10;
    const result: { decade: number; events: TimelineEvent[] }[] = [];

    for (let decade = minYear; decade <= maxYear; decade += 10) {
      const decadeEvents = events.filter(
        (e) => e.year >= decade && e.year < decade + 10
      );
      if (decadeEvents.length > 0) {
        result.push({ decade, events: decadeEvents });
      }
    }

    return result;
  }, [events]);

  const handleMemberClick = (memberId: string) => {
    setSelectedMember(memberId);
    openDrawer();
  };

  // Calculate generation bars
  const generations = useMemo(() => {
    const membersByGeneration = new Map<number, { member: FamilyMember; start: number; end: number }[]>();

    // Assign generations based on parent relationships
    const generationMap = new Map<string, number>();

    function assignGeneration(memberId: string, gen: number): void {
      if (generationMap.has(memberId)) return;
      generationMap.set(memberId, gen);

      const member = data.members.find((m) => m.id === memberId);
      if (!member) return;

      member.parentIds.forEach((pid) => assignGeneration(pid, gen - 1));
      member.childrenIds.forEach((cid) => assignGeneration(cid, gen + 1));
    }

    assignGeneration(data.rootPersonId, 0);

    // Normalize generations to start from 0
    const minGen = Math.min(...Array.from(generationMap.values()));
    generationMap.forEach((gen, id) => {
      generationMap.set(id, gen - minGen);
    });

    data.members.forEach((member) => {
      if (!member.birthDate) return;

      const gen = generationMap.get(member.id) ?? 0;
      const start = parseInt(getYearFromDate(member.birthDate));
      const end = member.deathDate
        ? parseInt(getYearFromDate(member.deathDate))
        : new Date().getFullYear();

      if (!membersByGeneration.has(gen)) {
        membersByGeneration.set(gen, []);
      }
      membersByGeneration.get(gen)!.push({ member, start, end });
    });

    return membersByGeneration;
  }, [data.members, data.rootPersonId]);

  const minYear = events.length > 0 ? events[0].year - 5 : 1940;
  const maxYear = new Date().getFullYear() + 5;
  const yearRange = maxYear - minYear;

  return (
    <div className="timeline-view">
      <div className="timeline-header">
        <h2>Хронология семьи</h2>
        <p>История семьи Чебаковых во времени</p>
      </div>

      <div className="timeline-chart">
        <div className="year-axis">
          {Array.from({ length: Math.ceil(yearRange / 10) + 1 }, (_, i) => {
            const year = Math.floor(minYear / 10) * 10 + i * 10;
            return (
              <div
                key={year}
                className="year-mark"
                style={{ left: `${((year - minYear) / yearRange) * 100}%` }}
              >
                <span>{year}</span>
              </div>
            );
          })}
        </div>

        <div className="generation-bars">
          {Array.from(generations.entries())
            .sort(([a], [b]) => a - b)
            .map(([gen, members]) => (
              <div key={gen} className="generation-row">
                <div className="generation-label">Поколение {gen + 1}</div>
                <div className="generation-members">
                  {members.map(({ member, start, end }) => (
                    <div
                      key={member.id}
                      className={`member-bar ${member.gender}`}
                      style={{
                        left: `${((start - minYear) / yearRange) * 100}%`,
                        width: `${((end - start) / yearRange) * 100}%`,
                      }}
                      onClick={() => handleMemberClick(member.id)}
                      title={`${getShortName(member)} (${start}–${member.deathDate ? end : 'н.в.'})`}
                    >
                      <span className="bar-name">{getShortName(member)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="timeline-events">
        <h3>События</h3>
        <div className="decades-list">
          {decades.map(({ decade, events }) => (
            <div key={decade} className="decade-group">
              <div className="decade-label">{decade}е</div>
              <div className="decade-events">
                {events.map((event, idx) => (
                  <div
                    key={`${event.member.id}-${event.type}-${idx}`}
                    className={`timeline-event ${event.type}`}
                    onClick={() => handleMemberClick(event.member.id)}
                  >
                    <div className="event-year">
                      <Calendar size={14} />
                      {event.year}
                    </div>
                    <div className="event-content">
                      <div className="event-avatar">
                        {event.member.photoUrl ? (
                          <img src={event.member.photoUrl} alt="" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div className="event-text">{event.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
