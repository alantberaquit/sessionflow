import BreakoutSession from "../models/BreakoutSession.js";
import PlenarySession from "../models/PlenarySession.js";

const compareSessions = (firstSession, secondSession) => {
  const firstStart = new Date(
    firstSession.startTime,
  ).getTime();

  const secondStart = new Date(
    secondSession.startTime,
  ).getTime();

  if (firstStart !== secondStart) {
    return firstStart - secondStart;
  }

  return firstSession.title.localeCompare(
    secondSession.title,
  );
};

const getParticipantSchedule = async ({
  registration,
}) => {
  if (!registration?.event) {
    throw new Error(
      "A registration with an event reference is required.",
    );
  }

  const eventId =
    registration.event?._id ||
    registration.event;

  const selectedBreakoutSessionIds = (
    registration.breakoutSelections || []
  )
    .map(
      (selection) =>
        selection.breakoutSession?._id ||
        selection.breakoutSession,
    )
    .filter(Boolean);

  const [
    plenarySessions,
    breakoutSessions,
  ] = await Promise.all([
    PlenarySession.find({
      event: eventId,
      isRequired: true,
      status: {
        $ne: "cancelled",
      },
    })
      .select(
        "title startsAt endsAt room displayOrder",
      )
      .sort({
        startsAt: 1,
        displayOrder: 1,
      })
      .lean(),

    selectedBreakoutSessionIds.length > 0
      ? BreakoutSession.find({
          _id: {
            $in: selectedBreakoutSessionIds,
          },
          event: eventId,
          status: {
            $ne: "cancelled",
          },
        })
          .select(
            "title room displayOrder breakoutBlock",
          )
          .populate({
            path: "breakoutBlock",
            select:
              "title startsAt endsAt displayOrder status",
          })
          .lean()
      : [],
  ]);

  const formattedPlenarySessions =
    plenarySessions.map((session) => ({
      id: session._id,
      type: "plenary",
      title: session.title,
      startTime: session.startsAt,
      endTime: session.endsAt,
      venue: session.room,
      displayOrder: session.displayOrder,
    }));

  const formattedBreakoutSessions =
    breakoutSessions
      .filter(
        (session) =>
          session.breakoutBlock &&
          session.breakoutBlock.status !==
            "cancelled",
      )
      .map((session) => ({
        id: session._id,
        type: "breakout",
        title: session.title,
        startTime:
          session.breakoutBlock.startsAt,
        endTime:
          session.breakoutBlock.endsAt,
        venue: session.room,
        blockTitle:
          session.breakoutBlock.title,
        displayOrder:
          session.breakoutBlock.displayOrder,
      }));

  return [
    ...formattedPlenarySessions,
    ...formattedBreakoutSessions,
  ].sort(compareSessions);
};

export default getParticipantSchedule;