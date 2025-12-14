export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
};

export type PositionedEvent<T = any> = T & {
  colIndex: number;
  colTotal: number;
};

export function detectCollisions<T extends CalendarEvent>(
  events: T[]
): PositionedEvent<T>[] {
  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  const result: PositionedEvent<T>[] = [];
  const groups: T[][] = [];

  for (const event of sorted) {
    let placed = false;

    for (const group of groups) {
      const last = group[group.length - 1];
      if (event.start < last.end) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      groups.push([event]);
    }
  }

  for (const group of groups) {
    group.forEach((event, index) => {
      result.push({
        ...(event as any),
        colIndex: index,
        colTotal: group.length,
      });
    });
  }

  return result;
}
