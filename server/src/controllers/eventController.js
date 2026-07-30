import BreakoutBlock from "../models/BreakoutBlock.js";
import BreakoutSession from "../models/BreakoutSession.js";
import Event from "../models/Event.js";
import PlenarySession from "../models/PlenarySession.js";

const getRegistrationState = (event) => {
  const now = new Date();
  const opensAt = new Date(
    event.registrationPeriod.opensAt,
  );
  const closesAt = new Date(
    event.registrationPeriod.closesAt,
  );

  if (event.status === "cancelled") {
    return "cancelled";
  }

  if (now < opensAt) {
    return "upcoming";
  }

  if (
    now >= opensAt &&
    now <= closesAt &&
    event.status === "registration-open"
  ) {
    return "open";
  }

  return "closed";
};

const formatPublicEvent = (event) => ({
  id: event._id,
  title: event.title,
  slug: event.slug,
  description: event.description,
  startDate: event.startDate,
  endDate: event.endDate,
  venue: event.venue,
  registrationPeriod: event.registrationPeriod,
  capacity: event.capacity,
  status: event.status,
  registrationState: getRegistrationState(event),
});

const formatPublicSpeaker = (speaker) => ({
  name: speaker.name,
  jobTitle: speaker.jobTitle,
  organization: speaker.organization,
});

const formatPublicPlenarySession = (session) => ({
  id: session._id,
  title: session.title,
  description: session.description,
  startsAt: session.startsAt,
  endsAt: session.endsAt,
  room: session.room,
  speakers: session.speakers.map(
    formatPublicSpeaker,
  ),
  displayOrder: session.displayOrder,
  isRequired: session.isRequired,
  status: session.status,
});

const formatPublicBreakoutSession = (session) => ({
  id: session._id,
  title: session.title,
  description: session.description,
  room: session.room,
  speakers: session.speakers.map(
    formatPublicSpeaker,
  ),
  capacity: session.capacity,
  displayOrder: session.displayOrder,
  status: session.status,
});

const formatPublicBreakoutBlock = (
  block,
  sessions,
) => ({
  id: block._id,
  title: block.title,
  description: block.description,
  startsAt: block.startsAt,
  endsAt: block.endsAt,
  displayOrder: block.displayOrder,
  minimumSelections: block.minimumSelections,
  maximumSelections: block.maximumSelections,
  status: block.status,
  sessions,
});

export const getPublishedEvents = async (
  _request,
  response,
) => {
  try {
    const events = await Event.find({
      isPublished: true,
      status: {
        $ne: "cancelled",
      },
    })
      .sort({
        startDate: 1,
      })
      .lean();

    response.status(200).json({
      events: events.map(formatPublicEvent),
      count: events.length,
    });
  } catch (error) {
    console.error(
      "Unable to retrieve published events:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to retrieve events at this time.",
    });
  }
};

export const getPublishedEventBySlug = async (
  request,
  response,
) => {
  try {
    const normalizedSlug = request.params.slug
      .trim()
      .toLowerCase();

    const event = await Event.findOne({
      slug: normalizedSlug,
      isPublished: true,
      status: {
        $ne: "cancelled",
      },
    }).lean();

    if (!event) {
      response.status(404).json({
        message: "Event not found.",
      });

      return;
    }

    const [
      plenarySessions,
      breakoutBlocks,
      breakoutSessions,
    ] = await Promise.all([
      PlenarySession.find({
        event: event._id,
        status: {
          $ne: "cancelled",
        },
      })
        .sort({
          startsAt: 1,
          displayOrder: 1,
        })
        .lean(),

      BreakoutBlock.find({
        event: event._id,
        status: {
          $ne: "cancelled",
        },
      })
        .sort({
          startsAt: 1,
          displayOrder: 1,
        })
        .lean(),

      BreakoutSession.find({
        event: event._id,
        status: {
          $ne: "cancelled",
        },
      })
        .sort({
          displayOrder: 1,
        })
        .lean(),
    ]);

    const sessionsByBlock = breakoutSessions.reduce(
      (groupedSessions, session) => {
        const blockId =
          session.breakoutBlock.toString();

        if (!groupedSessions[blockId]) {
          groupedSessions[blockId] = [];
        }

        groupedSessions[blockId].push(
          formatPublicBreakoutSession(session),
        );

        return groupedSessions;
      },
      {},
    );

    const formattedBreakoutBlocks =
      breakoutBlocks.map((block) => {
        const blockId = block._id.toString();

        return formatPublicBreakoutBlock(
          block,
          sessionsByBlock[blockId] || [],
        );
      });

    response.status(200).json({
      event: {
        ...formatPublicEvent(event),

        plenarySessions: plenarySessions.map(
          formatPublicPlenarySession,
        ),

        breakoutBlocks: formattedBreakoutBlocks,
      },
    });
  } catch (error) {
    console.error(
      "Unable to retrieve the published event:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to retrieve the event at this time.",
    });
  }
};