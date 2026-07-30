import jwt from "jsonwebtoken";

import User from "../models/User.js";

const authenticateUser = async (
  request,
  response,
  next,
) => {
  try {
    const authorizationHeader =
      request.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith("Bearer ")
    ) {
      return response.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authorizationHeader
      .slice("Bearer ".length)
      .trim();

    if (!token) {
      return response.status(401).json({
        message: "Authentication required",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        "JWT_SECRET is not defined in the environment variables",
      );
    }

    const decodedToken = jwt.verify(
      token,
      jwtSecret,
      {
        algorithms: ["HS256"],
      },
    );

    if (
      !decodedToken.sub ||
      typeof decodedToken.sub !== "string"
    ) {
      return response.status(401).json({
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(
      decodedToken.sub,
    );

    if (!user) {
      return response.status(401).json({
        message: "User account no longer exists",
      });
    }

    request.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return response.status(401).json({
        message: "Authentication token has expired",
      });
    }

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return response.status(401).json({
        message: "Invalid authentication token",
      });
    }

    console.error("Unable to authenticate request:");
    console.error(error.message);

    return response.status(500).json({
      message: "Unable to authenticate request",
    });
  }
};

export default authenticateUser;