import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import config from './src/config/config.js'
const Port = config.PORT;

connectDB();

app.listen(Port, () => {
    console.log("Server is running on port 3000");
});