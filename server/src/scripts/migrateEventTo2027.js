import mongoose from "mongoose";

import BreakoutBlock from "../models/BreakoutBlock.js";
import Event from "../models/Event.js";
import PlenarySession from "../models/PlenarySession.js";

const OLD_SLUG =
  "digital-learning-innovation-summit-2026";
const NEW_SLUG =
  "digital-learning-innovation-summit-2027";
const SCHEDULE_SHIFT_IN_MILLISECONDS =
  364 * 24 * 60 * 60 * 1000;

const shiftDate = (date) =>
  new Date(
    date.getTime() +
      SCHEDULE_SHIFT_IN_MILLISECONDS,
  );

const migrateEventTo2027 = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in the environment variables",
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const event = await Event.findOne({
      slug: OLD_SLUG,
    });

    if (!event) {
      const migratedEvent = await Event.findOne({
        slug: NEW_SLUG,
      }).select("title slug");

      if (migratedEvent) {
        console.log(
          `Event is already updated: ${migratedEvent.title}`,
        );
        return;
      }

      throw new Error(
        "The sample event could not be found.",
      );
    }

    const [plenarySessions, breakoutBlocks] =
      await Promise.all([
        PlenarySession.find({ event: event._id }),
        BreakoutBlock.find({ event: event._id }),
      ]);

    event.title =
      "Digital Learning & Innovation Summit 2027";
    event.slug = NEW_SLUG;
    event.startDate = new Date(
      "2027-10-14T00:30:00.000Z",
    );
    event.endDate = new Date(
      "2027-10-15T09:00:00.000Z",
    );
    event.registrationPeriod = {
      opensAt: new Date(
        "2026-10-01T00:00:00.000Z",
      ),
      closesAt: new Date(
        "2027-10-10T15:59:59.000Z",
      ),
    };
    event.status = "registration-open";

    for (const session of plenarySessions) {
      session.startsAt = shiftDate(
        session.startsAt,
      );
      session.endsAt = shiftDate(session.endsAt);
    }

    for (const block of breakoutBlocks) {
      block.startsAt = shiftDate(block.startsAt);
      block.endsAt = shiftDate(block.endsAt);
      block.status = "selection-open";
    }

    await Promise.all([
      event.save(),
      ...plenarySessions.map((session) =>
        session.save(),
      ),
      ...breakoutBlocks.map((block) =>
        block.save(),
      ),
    ]);

    console.log(
      `Updated ${event.title} without replacing registrations.`,
    );
    console.log(`Event slug: ${event.slug}`);
    console.log(
      `Shifted ${plenarySessions.length} plenary sessions and ${breakoutBlocks.length} breakout blocks.`,
    );
  } catch (error) {
    console.error("Event migration failed");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migrateEventTo2027();
