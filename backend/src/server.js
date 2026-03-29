const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const { connectDatabase } = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Back2You backend running on port ${PORT}`);
  });
});
