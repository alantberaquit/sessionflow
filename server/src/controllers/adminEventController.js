import BreakoutBlock from "../models/BreakoutBlock.js";
import BreakoutSession from "../models/BreakoutSession.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import PlenarySession from "../models/PlenarySession.js";

const sendError = (response, error) => {
  if (error?.name === "ValidationError") {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([key, value]) => [key, value.message]),
    );
    return response.status(400).json({ message: "Validation failed", errors });
  }
  if (error?.code === 11000) {
    return response.status(409).json({ message: "A record with that slug or display order already exists." });
  }
  console.error("Unable to manage event content:", error);
  return response.status(500).json({ message: "Unable to manage event content." });
};

const speakersFrom = (value) =>
  Array.isArray(value)
    ? value.map((speaker) => ({
        name: String(speaker?.name || "").trim(),
        jobTitle: String(speaker?.jobTitle || "").trim(),
        organization: String(speaker?.organization || "").trim(),
      }))
    : [];

const eventPayload = (body = {}) => ({
  title: body.title,
  slug: body.slug,
  summary: body.summary,
  description: body.description,
  startDate: body.startDate,
  endDate: body.endDate,
  venue: body.venue,
  registrationPeriod: body.registrationPeriod,
  registrationFee: {
    amountInCentavos: Number(body.registrationFee?.amountInCentavos),
    currency: "PHP",
  },
  capacity: Number(body.capacity),
  status: body.status,
  isPublished: Boolean(body.isPublished),
});

const verifySchedule = (event, startsAt, endsAt) => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    const error = new Error("Provide valid session start and end times.");
    error.status = 400;
    throw error;
  }
  if (start < event.startDate || end > event.endDate) {
    const error = new Error("Session times must fall within the event schedule.");
    error.status = 400;
    throw error;
  }
};

const getEvent = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error("Event not found.");
    error.status = 404;
    throw error;
  }
  return event;
};

const sendManagedError = (response, error) => {
  if (error?.status) return response.status(error.status).json({ message: error.message });
  return sendError(response, error);
};

export const listAdminEvents = async (_request, response) => {
  try {
    const events = await Event.find().sort({ startDate: -1 }).lean();
    response.json({ events });
  } catch (error) {
    sendError(response, error);
  }
};

export const getAdminEvent = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    const [plenarySessions, breakoutBlocks, breakoutSessions] = await Promise.all([
      PlenarySession.find({ event: event._id }).sort({ startsAt: 1, displayOrder: 1 }).lean(),
      BreakoutBlock.find({ event: event._id }).sort({ startsAt: 1, displayOrder: 1 }).lean(),
      BreakoutSession.find({ event: event._id }).sort({ displayOrder: 1 }).lean(),
    ]);
    response.json({ event, plenarySessions, breakoutBlocks, breakoutSessions });
  } catch (error) {
    sendManagedError(response, error);
  }
};

export const createAdminEvent = async (request, response) => {
  try {
    const event = await Event.create(eventPayload(request.body));
    response.status(201).json({ message: "Event created.", event });
  } catch (error) {
    sendError(response, error);
  }
};

export const updateAdminEvent = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    Object.assign(event, eventPayload(request.body));
    await event.save();
    response.json({ message: "Event updated.", event });
  } catch (error) {
    sendManagedError(response, error);
  }
};

export const createPlenarySession = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    verifySchedule(event, request.body.startsAt, request.body.endsAt);
    const session = await PlenarySession.create({
      event: event._id,
      title: request.body.title,
      description: request.body.description,
      startsAt: request.body.startsAt,
      endsAt: request.body.endsAt,
      room: request.body.room,
      speakers: speakersFrom(request.body.speakers),
      displayOrder: Number(request.body.displayOrder),
      isRequired: request.body.isRequired !== false,
      status: request.body.status,
    });
    response.status(201).json({ message: "Plenary session added.", session });
  } catch (error) {
    sendManagedError(response, error);
  }
};

export const updatePlenarySession = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    verifySchedule(event, request.body.startsAt, request.body.endsAt);
    const session = await PlenarySession.findOne({ _id: request.params.sessionId, event: event._id });
    if (!session) return response.status(404).json({ message: "Plenary session not found." });
    Object.assign(session, {
      title: request.body.title, description: request.body.description,
      startsAt: request.body.startsAt, endsAt: request.body.endsAt,
      room: request.body.room, speakers: speakersFrom(request.body.speakers),
      displayOrder: Number(request.body.displayOrder), isRequired: request.body.isRequired !== false,
      status: request.body.status,
    });
    await session.save();
    response.json({ message: "Plenary session updated.", session });
  } catch (error) { sendManagedError(response, error); }
};

export const deletePlenarySession = async (request, response) => {
  try {
    const session = await PlenarySession.findOneAndDelete({ _id: request.params.sessionId, event: request.params.eventId });
    if (!session) return response.status(404).json({ message: "Plenary session not found." });
    response.json({ message: "Plenary session deleted." });
  } catch (error) { sendError(response, error); }
};

export const createBreakoutBlock = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    verifySchedule(event, request.body.startsAt, request.body.endsAt);
    const block = await BreakoutBlock.create({
      event: event._id, title: request.body.title, description: request.body.description,
      startsAt: request.body.startsAt, endsAt: request.body.endsAt,
      displayOrder: Number(request.body.displayOrder),
      minimumSelections: Number(request.body.minimumSelections),
      maximumSelections: Number(request.body.maximumSelections), status: request.body.status,
    });
    response.status(201).json({ message: "Breakout block added.", block });
  } catch (error) { sendManagedError(response, error); }
};

export const updateBreakoutBlock = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    verifySchedule(event, request.body.startsAt, request.body.endsAt);
    const block = await BreakoutBlock.findOne({ _id: request.params.blockId, event: event._id });
    if (!block) return response.status(404).json({ message: "Breakout block not found." });
    Object.assign(block, {
      title: request.body.title, description: request.body.description,
      startsAt: request.body.startsAt, endsAt: request.body.endsAt,
      displayOrder: Number(request.body.displayOrder),
      minimumSelections: Number(request.body.minimumSelections),
      maximumSelections: Number(request.body.maximumSelections), status: request.body.status,
    });
    await block.save();
    response.json({ message: "Breakout block updated.", block });
  } catch (error) { sendManagedError(response, error); }
};

export const deleteBreakoutBlock = async (request, response) => {
  try {
    const registrations = await EventRegistration.exists({ event: request.params.eventId, "breakoutSelections.breakoutBlock": request.params.blockId });
    if (registrations) return response.status(409).json({ message: "This block has participant selections and cannot be deleted." });
    await BreakoutSession.deleteMany({ event: request.params.eventId, breakoutBlock: request.params.blockId });
    const block = await BreakoutBlock.findOneAndDelete({ _id: request.params.blockId, event: request.params.eventId });
    if (!block) return response.status(404).json({ message: "Breakout block not found." });
    response.json({ message: "Breakout block and its sessions deleted." });
  } catch (error) { sendError(response, error); }
};

export const createBreakoutSession = async (request, response) => {
  try {
    const event = await getEvent(request.params.eventId);
    const block = await BreakoutBlock.findOne({ _id: request.params.blockId, event: event._id });
    if (!block) return response.status(404).json({ message: "Breakout block not found." });
    const session = await BreakoutSession.create({
      event: event._id, breakoutBlock: block._id, title: request.body.title,
      description: request.body.description, room: request.body.room,
      speakers: speakersFrom(request.body.speakers), capacity: Number(request.body.capacity),
      displayOrder: Number(request.body.displayOrder), status: request.body.status,
    });
    response.status(201).json({ message: "Breakout session added.", session });
  } catch (error) { sendManagedError(response, error); }
};

export const updateBreakoutSession = async (request, response) => {
  try {
    const session = await BreakoutSession.findOne({ _id: request.params.sessionId, event: request.params.eventId, breakoutBlock: request.params.blockId });
    if (!session) return response.status(404).json({ message: "Breakout session not found." });
    Object.assign(session, {
      title: request.body.title, description: request.body.description, room: request.body.room,
      speakers: speakersFrom(request.body.speakers), capacity: Number(request.body.capacity),
      displayOrder: Number(request.body.displayOrder), status: request.body.status,
    });
    await session.save();
    response.json({ message: "Breakout session updated.", session });
  } catch (error) { sendManagedError(response, error); }
};

export const deleteBreakoutSession = async (request, response) => {
  try {
    const registrations = await EventRegistration.exists({ event: request.params.eventId, "breakoutSelections.breakoutSession": request.params.sessionId });
    if (registrations) return response.status(409).json({ message: "This session has participant selections and cannot be deleted." });
    const session = await BreakoutSession.findOneAndDelete({ _id: request.params.sessionId, event: request.params.eventId, breakoutBlock: request.params.blockId });
    if (!session) return response.status(404).json({ message: "Breakout session not found." });
    response.json({ message: "Breakout session deleted." });
  } catch (error) { sendError(response, error); }
};
