import mongoose from "mongoose";

import BreakoutBlock from "../models/BreakoutBlock.js";
import BreakoutSession from "../models/BreakoutSession.js";
import Event from "../models/Event.js";
import PlenarySession from "../models/PlenarySession.js";

const EVENT_SLUG =
  "digital-learning-innovation-summit-2026";

const connectToDatabase = async () => {
  const mongoDbUri = process.env.MONGODB_URI;

  if (!mongoDbUri) {
    throw new Error(
      "MONGODB_URI is not defined in the environment variables",
    );
  }

  await mongoose.connect(mongoDbUri);

  console.log("MongoDB connected for event seeding");
};

const removeExistingSampleEvent = async () => {
  const existingEvent = await Event.findOne({
    slug: EVENT_SLUG,
  }).select("_id");

  if (!existingEvent) {
    return;
  }

  await Promise.all([
    PlenarySession.deleteMany({
      event: existingEvent._id,
    }),

    BreakoutSession.deleteMany({
      event: existingEvent._id,
    }),

    BreakoutBlock.deleteMany({
      event: existingEvent._id,
    }),
  ]);

  await Event.deleteOne({
    _id: existingEvent._id,
  });

  console.log("Previous sample event removed");
};

const createEvent = async () => {
  const event = await Event.create({
    title:
      "Digital Learning & Innovation Summit 2026",

    slug: EVENT_SLUG,

    summary:
      "A two-day summit for educators, instructional designers, trainers, and technology leaders exploring practical innovations in digital learning.",

    description:
      "A two-day professional learning summit for educators, instructional designers, trainers, and technology leaders exploring practical approaches to digital learning, artificial intelligence, accessibility, and learning experience design.",

    startDate: new Date(
      "2026-10-15T00:30:00.000Z",
    ),

    endDate: new Date(
      "2026-10-16T09:00:00.000Z",
    ),

    venue: {
      name:
        "Metro Manila Learning Convention Center",
      address:
        "Innovation Avenue, Ortigas Center",
      city: "Pasig City",
      country: "Philippines",
    },

    registrationPeriod: {
      opensAt: new Date(
        "2026-08-01T00:00:00.000Z",
      ),

      closesAt: new Date(
        "2026-10-10T15:59:59.000Z",
      ),
    },

    registrationFee: {
      amountInCentavos: 350000,
      currency: "PHP",
    },

    capacity: 300,

    status: "registration-open",

    isPublished: true,
  });

  console.log(`Event created: ${event.title}`);

  return event;
};

const createPlenarySessions = async (eventId) => {
  const plenarySessions = await PlenarySession.insertMany([
    {
      event: eventId,

      title:
        "Opening Program and The Future of Digital Learning",

      description:
        "The summit opens with an overview of emerging opportunities, challenges, and practical priorities shaping the future of technology-enabled education.",

      startsAt: new Date(
        "2026-10-15T00:30:00.000Z",
      ),

      endsAt: new Date(
        "2026-10-15T02:00:00.000Z",
      ),

      room: "Grand Ballroom",

      speakers: [
        {
          name: "Dr. Maria Santos",
          jobTitle:
            "Director of Digital Learning",
          organization:
            "Philippine Learning Futures Institute",
        },
      ],

      displayOrder: 1,

      isRequired: true,

      status: "scheduled",
    },

    {
      event: eventId,

      title:
        "Responsible Artificial Intelligence in Education",

      description:
        "A keynote discussion on adopting artificial intelligence responsibly while protecting learner privacy, academic integrity, accessibility, and human-centered teaching.",

      startsAt: new Date(
        "2026-10-16T00:30:00.000Z",
      ),

      endsAt: new Date(
        "2026-10-16T02:00:00.000Z",
      ),

      room: "Grand Ballroom",

      speakers: [
        {
          name: "Engr. Daniel Cruz",
          jobTitle:
            "Education Technology Research Lead",
          organization:
            "Center for Responsible AI",
        },
      ],

      displayOrder: 2,

      isRequired: true,

      status: "scheduled",
    },

    {
      event: eventId,

      title:
        "Closing Plenary and Summit Commitments",

      description:
        "Participants reflect on key lessons from the summit and identify practical commitments they can apply within their schools, organizations, and learning programs.",

      startsAt: new Date(
        "2026-10-16T07:30:00.000Z",
      ),

      endsAt: new Date(
        "2026-10-16T09:00:00.000Z",
      ),

      room: "Grand Ballroom",

      speakers: [
        {
          name: "Prof. Andrea Lim",
          jobTitle:
            "Learning Innovation Program Chair",
          organization:
            "Digital Learning Summit Council",
        },
      ],

      displayOrder: 3,

      isRequired: true,

      status: "scheduled",
    },
  ]);

  console.log(
    `${plenarySessions.length} plenary sessions created`,
  );

  return plenarySessions;
};

const createBreakoutBlocks = async (eventId) => {
  const breakoutBlocks =
    await BreakoutBlock.insertMany([
      {
        event: eventId,

        title: "Breakout Block 1",

        description:
          "Choose one morning session focused on practical digital-learning foundations.",

        startsAt: new Date(
          "2026-10-15T02:30:00.000Z",
        ),

        endsAt: new Date(
          "2026-10-15T04:00:00.000Z",
        ),

        displayOrder: 1,

        minimumSelections: 1,

        maximumSelections: 1,

        status: "selection-open",
      },

      {
        event: eventId,

        title: "Breakout Block 2",

        description:
          "Choose one afternoon session focused on content creation and learning delivery.",

        startsAt: new Date(
          "2026-10-15T05:30:00.000Z",
        ),

        endsAt: new Date(
          "2026-10-15T07:00:00.000Z",
        ),

        displayOrder: 2,

        minimumSelections: 1,

        maximumSelections: 1,

        status: "selection-open",
      },

      {
        event: eventId,

        title: "Breakout Block 3",

        description:
          "Choose one morning session focused on artificial intelligence and emerging technologies.",

        startsAt: new Date(
          "2026-10-16T02:30:00.000Z",
        ),

        endsAt: new Date(
          "2026-10-16T04:00:00.000Z",
        ),

        displayOrder: 3,

        minimumSelections: 1,

        maximumSelections: 1,

        status: "selection-open",
      },

      {
        event: eventId,

        title: "Breakout Block 4",

        description:
          "Choose one afternoon session focused on implementation, evaluation, and organizational change.",

        startsAt: new Date(
          "2026-10-16T05:30:00.000Z",
        ),

        endsAt: new Date(
          "2026-10-16T07:00:00.000Z",
        ),

        displayOrder: 4,

        minimumSelections: 1,

        maximumSelections: 1,

        status: "selection-open",
      },
    ]);

  console.log(
    `${breakoutBlocks.length} breakout blocks created`,
  );

  return breakoutBlocks;
};

const createBreakoutSessions = async (
  eventId,
  breakoutBlocks,
) => {
  const [
    blockOne,
    blockTwo,
    blockThree,
    blockFour,
  ] = breakoutBlocks;

  const breakoutSessions =
    await BreakoutSession.insertMany([
      {
        event: eventId,
        breakoutBlock: blockOne._id,

        title:
          "Designing Effective Microlearning",

        description:
          "Explore practical methods for breaking complex topics into focused, engaging, and measurable microlearning experiences.",

        room: "Learning Lab A",

        speakers: [
          {
            name: "Ana Reyes",
            jobTitle:
              "Learning Experience Designer",
            organization:
              "Digital Learning Lab",
          },
        ],

        capacity: 80,
        displayOrder: 1,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockOne._id,

        title:
          "Building Accessible Digital Courses",

        description:
          "Apply accessibility principles to course structure, visual design, multimedia, navigation, and assessment activities.",

        room: "Learning Lab B",

        speakers: [
          {
            name: "Paolo Mendoza",
            jobTitle:
              "Inclusive Design Specialist",
            organization:
              "Accessible Learning Network",
          },
        ],

        capacity: 80,
        displayOrder: 2,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockOne._id,

        title:
          "Facilitating Engaging Virtual Classrooms",

        description:
          "Learn facilitation techniques that encourage participation, collaboration, reflection, and meaningful learner interaction online.",

        room: "Learning Lab C",

        speakers: [
          {
            name: "Camille Navarro",
            jobTitle:
              "Virtual Learning Facilitator",
            organization:
              "Connected Classrooms Asia",
          },
        ],

        capacity: 80,
        displayOrder: 3,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockTwo._id,

        title:
          "Storyboarding Interactive Learning Content",

        description:
          "Transform learning objectives into clear storyboards that guide content writing, media production, interaction design, and development.",

        room: "Learning Lab A",

        speakers: [
          {
            name: "Miguel Garcia",
            jobTitle:
              "Senior Instructional Designer",
            organization:
              "Learning Studio Philippines",
          },
        ],

        capacity: 80,
        displayOrder: 1,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockTwo._id,

        title:
          "Creating Practical Scenario-Based Learning",

        description:
          "Develop realistic workplace and classroom scenarios that allow learners to practice judgment, decision-making, and problem-solving.",

        room: "Learning Lab B",

        speakers: [
          {
            name: "Lara Villanueva",
            jobTitle:
              "Curriculum Development Manager",
            organization:
              "Applied Learning Solutions",
          },
        ],

        capacity: 80,
        displayOrder: 2,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockTwo._id,

        title:
          "Producing Learning Videos with Limited Resources",

        description:
          "Plan and produce clear instructional videos using affordable tools, simple workflows, and effective multimedia-learning principles.",

        room: "Learning Lab C",

        speakers: [
          {
            name: "Rafael Torres",
            jobTitle:
              "Educational Media Producer",
            organization:
              "Open Media Classroom",
          },
        ],

        capacity: 80,
        displayOrder: 3,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockThree._id,

        title:
          "Practical AI Tools for Educators",

        description:
          "Evaluate and use generative artificial intelligence tools for lesson planning, content drafting, feedback, and administrative support.",

        room: "Learning Lab A",

        speakers: [
          {
            name: "Janelle Aquino",
            jobTitle:
              "AI Learning Solutions Consultant",
            organization:
              "FutureReady Education",
          },
        ],

        capacity: 80,
        displayOrder: 1,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockThree._id,

        title:
          "Writing Better Prompts for Learning Tasks",

        description:
          "Practice structured prompting techniques for generating useful learning materials while checking accuracy, bias, and instructional quality.",

        room: "Learning Lab B",

        speakers: [
          {
            name: "Noel Castillo",
            jobTitle:
              "Learning Technology Specialist",
            organization:
              "Prompted Learning Institute",
          },
        ],

        capacity: 80,
        displayOrder: 2,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockThree._id,

        title:
          "Protecting Learner Data in AI-Enabled Programs",

        description:
          "Identify privacy, security, consent, and governance considerations when introducing artificial intelligence into learning environments.",

        room: "Learning Lab C",

        speakers: [
          {
            name: "Attorney Sofia Ramos",
            jobTitle:
              "Data Privacy and Technology Counsel",
            organization:
              "Education Data Protection Center",
          },
        ],

        capacity: 80,
        displayOrder: 3,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockFour._id,

        title:
          "Evaluating Digital Learning Effectiveness",

        description:
          "Use practical evidence and performance indicators to determine whether digital-learning programs are engaging, useful, and effective.",

        room: "Learning Lab A",

        speakers: [
          {
            name: "Dr. Jerome Flores",
            jobTitle:
              "Learning Analytics Lead",
            organization:
              "Evidence-Based Learning Center",
          },
        ],

        capacity: 80,
        displayOrder: 1,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockFour._id,

        title:
          "Managing a Learning Technology Rollout",

        description:
          "Plan stakeholder communication, training, support, governance, and adoption activities for a successful learning-technology implementation.",

        room: "Learning Lab B",

        speakers: [
          {
            name: "Patricia Co",
            jobTitle:
              "Digital Transformation Manager",
            organization:
              "Learning Systems Group",
          },
        ],

        capacity: 80,
        displayOrder: 2,
        status: "available",
      },

      {
        event: eventId,
        breakoutBlock: blockFour._id,

        title:
          "Building a Sustainable Learning Content Workflow",

        description:
          "Establish practical roles, review processes, quality standards, publishing workflows, and maintenance plans for learning content.",

        room: "Learning Lab C",

        speakers: [
          {
            name: "Marco de Leon",
            jobTitle:
              "Content Operations Director",
            organization:
              "Learning Content Collective",
          },
        ],

        capacity: 80,
        displayOrder: 3,
        status: "available",
      },
    ]);

  console.log(
    `${breakoutSessions.length} breakout sessions created`,
  );

  return breakoutSessions;
};

const seedEvent = async () => {
  try {
    await connectToDatabase();

    await removeExistingSampleEvent();

    const event = await createEvent();

    const plenarySessions =
      await createPlenarySessions(event._id);

    const breakoutBlocks =
      await createBreakoutBlocks(event._id);

    const breakoutSessions =
      await createBreakoutSessions(
        event._id,
        breakoutBlocks,
      );

    console.log("");
    console.log("Event seed completed successfully");
    console.log(`Event ID: ${event._id}`);
    console.log(
      `Plenary sessions: ${plenarySessions.length}`,
    );
    console.log(
      `Breakout blocks: ${breakoutBlocks.length}`,
    );
    console.log(
      `Breakout sessions: ${breakoutSessions.length}`,
    );
  } catch (error) {
    console.error("");
    console.error("Event seed failed");
    console.error(error);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB connection closed");
  }
};

seedEvent();