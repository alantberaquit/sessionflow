import ParticipantProfile from "../models/ParticipantProfile.js";

const CONTACT_NUMBER_PATTERN =
  /^\+?[0-9\s().-]{7,30}$/;

const buildSafeProfile = (profile) => ({
  id: profile._id,
  organization: profile.organization,
  jobTitle: profile.jobTitle,
  contactNumber: profile.contactNumber,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const validateProfileData = ({
  organization,
  jobTitle,
  contactNumber,
}) => {
  const errors = {};

  if (!organization) {
    errors.organization = "Organization is required";
  } else if (organization.length < 2) {
    errors.organization =
      "Organization must contain at least 2 characters";
  } else if (organization.length > 150) {
    errors.organization =
      "Organization cannot exceed 150 characters";
  }

  if (!jobTitle) {
    errors.jobTitle = "Job title is required";
  } else if (jobTitle.length < 2) {
    errors.jobTitle =
      "Job title must contain at least 2 characters";
  } else if (jobTitle.length > 100) {
    errors.jobTitle =
      "Job title cannot exceed 100 characters";
  }

  if (!contactNumber) {
    errors.contactNumber =
      "Contact number is required";
  } else if (contactNumber.length > 30) {
    errors.contactNumber =
      "Contact number cannot exceed 30 characters";
  } else if (
    !CONTACT_NUMBER_PATTERN.test(contactNumber)
  ) {
    errors.contactNumber =
      "Please provide a valid contact number";
  }

  return errors;
};

export const getParticipantProfile = async (
  request,
  response,
) => {
  try {
    const profile = await ParticipantProfile.findOne({
      user: request.user._id,
    });

    if (!profile) {
      return response.status(200).json({
        profile: null,
        isProfileComplete: false,
      });
    }

    return response.status(200).json({
      profile: buildSafeProfile(profile),
      isProfileComplete: true,
    });
  } catch (error) {
    console.error("Unable to retrieve participant profile:");
    console.error(error.message);

    return response.status(500).json({
      message: "Unable to retrieve participant profile",
    });
  }
};

export const saveParticipantProfile = async (
  request,
  response,
) => {
  try {
    const {
      organization,
      jobTitle,
      contactNumber,
    } = request.body ?? {};

    const normalizedProfileData = {
      organization:
        typeof organization === "string"
          ? organization.trim()
          : "",
      jobTitle:
        typeof jobTitle === "string"
          ? jobTitle.trim()
          : "",
      contactNumber:
        typeof contactNumber === "string"
          ? contactNumber.trim()
          : "",
    };

    const errors = validateProfileData(
      normalizedProfileData,
    );

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const existingProfile =
      await ParticipantProfile.findOne({
        user: request.user._id,
      });

    if (!existingProfile) {
      const profile = await ParticipantProfile.create({
        user: request.user._id,
        ...normalizedProfileData,
      });

      return response.status(201).json({
        message:
          "Participant profile created successfully",
        profile: buildSafeProfile(profile),
        isProfileComplete: true,
      });
    }

    existingProfile.organization =
      normalizedProfileData.organization;

    existingProfile.jobTitle =
      normalizedProfileData.jobTitle;

    existingProfile.contactNumber =
      normalizedProfileData.contactNumber;

    await existingProfile.save();

    return response.status(200).json({
      message:
        "Participant profile updated successfully",
      profile: buildSafeProfile(existingProfile),
      isProfileComplete: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message:
          "A participant profile already exists for this account",
      });
    }

    console.error("Unable to save participant profile:");
    console.error(error.message);

    return response.status(500).json({
      message: "Unable to save participant profile",
    });
  }
};