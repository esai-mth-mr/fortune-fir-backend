require("dotenv").config(); // Secures variables
import connectToDatabase from "./utils/mongo";

const app = require("./utils/app"); // Backend App (server)

const Routes = require("./routes");
const { PORT } = require("./constants");

app.use("/api", Routes);

connectToDatabase();

var http = require("http").createServer(app);

let io = http.listen(PORT, () => {
  console.log(`✅ Server is listening on port: ${PORT}`);
});
