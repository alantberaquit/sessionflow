const authorizeAdmin = (
  request,
  response,
  next,
) => {
  if (!request.user) {
    response.status(401).json({
      message: "Authentication required",
      code: "AUTHENTICATION_REQUIRED",
    });

    return;
  }

  if (request.user.role !== "admin") {
    response.status(403).json({
      message:
        "Administrator access is required.",
      code: "ADMIN_ACCESS_REQUIRED",
    });

    return;
  }

  next();
};

export default authorizeAdmin;