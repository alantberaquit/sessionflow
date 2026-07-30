import jwt from "jsonwebtoken";

const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";

  if (!jwtSecret) {
    throw new Error(
      "JWT_SECRET is not defined in the environment variables",
    );
  }

  return jwt.sign(
    {
      role: user.role,
    },
    jwtSecret,
    {
      subject: user._id.toString(),
      expiresIn: jwtExpiresIn,
    },
  );
};

export default generateToken;