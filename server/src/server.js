import express from "express";

const app = express();
const PORT = 5001;

app.get("/", (_request, response) => {
  response.json({
    message: "SessionFlow API is running",
  });
});

app.listen(PORT, () => {
  console.log(`SessionFlow server is running on port ${PORT}`);
});