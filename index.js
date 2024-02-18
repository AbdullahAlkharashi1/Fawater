// Import required modules
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import session from "express-session";
import { log } from "console";
import { title } from "process";
import ejs from "ejs";
import flash from "connect-flash";
import { spawn } from "child_process";

// Create an Express app
const app = express();
const port = 3000;

// Set up middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configure session management
app.use(
  session({
    secret: "abdullah",
    resave: false,
    saveUninitialized: false,
  })
);
// Enable flash messages
app.use(flash());

// Enable JSON parsing for application/json requests
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Users", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the User schema for MongoDB
const userSchema = {
  Fname: String,
  Mname: String,
  Lname: String,
  Id: Number,
  Pnumber: Number,
  Email: String,
  Password: String,
  DOB: Date,
  Gender: String,
  Income: Number,
  Occupation: String,
  OwnerShip: String,
  Education: String,
  Residence: String,
  NOccupants: Number,
  Residence: String,
  HouseSize: Number,
  NBedrooms: Number,
  NBathrooms: Number,
  NCooling: Number,
  YearBuilt: Number,
};
const User = mongoose.model("User", userSchema);

// Define a sub-schema for previous month water details
const prevElectricityDetailsSchema = new mongoose.Schema({
  year: Number,
  month: Number,
  billPrice: Number,
});

// Define the Electricity Consumption Schema for MongoDB
const electricityConsumptionSchema = new mongoose.Schema({
  currentMonthElectricityExpected: Number,
  currentMonthElectricityActual: Number,
  prevMonthElectricityExpected: Number,
  prevMonthElectricityActual: [prevElectricityDetailsSchema], // Array of previous electricity details
  upcomingMonthElectricityExpected_1: Number,
  upcomingMonthElectricityExpected_2: Number,
  upcomingMonthElectricityExpected_3: Number,
  upcomingMonthElectricityExpected_4: Number,

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Create Mongoose model
const Electricity = mongoose.model("Electricity", electricityConsumptionSchema);

// Define a sub-schema for previous month water details
const prevWaterDetailsSchema = new mongoose.Schema({
  year: Number,
  month: Number,
  billPrice: Number,
});

// Define the Water Consumption Schema for MongoDB
const waterConsumptionSchema = new mongoose.Schema({
  currentMonthWaterExpected: Number,
  currentMonthWaterActual: Number,
  prevMonthWaterExpected: Number,
  prevMonthWaterActual: [prevWaterDetailsSchema], // Array of previous water details
  upcomingMonthWaterExpected_1: Number,
  upcomingMonthWaterExpected_2: Number,
  upcomingMonthWaterExpected_3: Number,
  upcomingMonthWaterExpected_4: Number,

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Create Mongoose model
const Water = mongoose.model("Water", waterConsumptionSchema);

// Define the Nighbor Electricity Consumption Schema for MongoDB
const nighborElectricityConsumptionSchema = new mongoose.Schema({
  userAvgElectricity: Number,
  nighborElectricityFamily: Number,
  nighborElectricitySize: Number,
  nighborElectricityBathroom: Number,
  nighborElectricityTotalAVG: Number,

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Create Mongoose model
const NighborElectricity = mongoose.model(
  "NighborElectricity",
  nighborElectricityConsumptionSchema
);

// Define the Nighbor Water Consumption Schema for MongoDB
const nighborWaterConsumptionSchema = new mongoose.Schema({
  userAvgWater: Number,
  nighborWaterFamily: Number,
  nighborWaterSize: Number,
  nighborWaterBathroom: Number,
  nighborWaterTotalAVG: Number,

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Create Mongoose model
const NighborWater = mongoose.model(
  "NighborWater",
  nighborWaterConsumptionSchema
);

// Set up routes and route handlers
// Home route
app.get("/", (req, res) => {
  res.render("home.ejs");
});


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.isLoggedIn) {
    return next();
  }
  res.redirect("/login"); // Redirect to the login page if not logged in
}

// Register route
app.get("/register", (req, res) => {
  res.render("register.ejs", {
    isLoggedIn: req.session.isAuthenticated || false,
  });
});

// home route
app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.get("/waterdata", isAuthenticated, (req, res) => {
  res.render("waterdata.ejs", {
    username: req.session.user,
    isLoggedIn: req.session.isAuthenticated || false,
  });
});

// menu route
app.get("/menu", (req, res) => {
  res.render("menu.ejs", {
    username: req.session.username,
    isLoggedIn: req.session.isAuthenticated || false,
  });
});

// login route
app.get("/login", (req, res) => {
  res.render("login.ejs", {
    flash: req.flash(),
    isLoggedIn: req.session.isAuthenticated || false,
  });
});

app.get("/advice", isAuthenticated,(req, res) => {
  res.render("advice.ejs", {
    flash: req.flash(),
    isLoggedIn: req.session.isAuthenticated || false,
  });
  
});

// profile route
app.get("/profile", isAuthenticated, (req, res) => {
  res.render("profile.ejs", {
    username: req.session.username,
    idname: req.session.name,
    isLoggedIn: req.session.isAuthenticated || false,
  });
});

// Electricity route
app.get("/Electricity", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const electricityData = await Electricity.findOne({ user: userId });

    if (!electricityData) {
      console.error("No data found in the database Electricity Data.");
      return res.status(404).send("No data found Electricity Data");
    }

    console.log("Retrieved data from the database:", electricityData);

    res.render("electricity.ejs", {
      dataJson: JSON.stringify(electricityData),
      isLoggedIn: req.session.isAuthenticated || false,
    });
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Water route
app.get("/Water", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const waterData = await Water.findOne({ user: userId });
    if (!waterData) {
      console.error("No data found in the database Water Data.");
      return res.status(404).send("No data found Water Data");
    }
    res.render("water.ejs", {
      dataJson: JSON.stringify(waterData),
      isLoggedIn: req.session.isAuthenticated || false,
    });
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
});

// NighborWater route
app.get("/NighborWater", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Retrieve Water data for average calculation
    const waterData = await Water.findOne({ user: userId });
    if (!waterData || !waterData.prevMonthWaterActual) {
      console.error("No water data found for user");
      return res.status(404).send("No water data found");
    }

    const sum = waterData.prevMonthWaterActual.reduce((acc, monthData) => {
      return acc + (monthData.billPrice || 0);
    }, 0);

    const count = waterData.prevMonthWaterActual.length;
    const waterAvg = count > 0 ? sum / count : 0;

    // Retrieve or create NighborWater data
    let nighborWaterData = await NighborWater.findOne({ user: userId });
    if (!nighborWaterData) {
      // Create new document if not exists
      nighborWaterData = new NighborWater({ user: userId });
    }

    // Update the userAvgWater field
    nighborWaterData.userAvgWater = waterAvg;
    await nighborWaterData.save();

    // Send data to the EJS template
    res.render("nighborWater.ejs", {
      dataJson: JSON.stringify(nighborWaterData),
      isLoggedIn: req.session.isAuthenticated || false,
    });

    console.log("Retrieved data from the database:", nighborWaterData);
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
});

// NighborElectricity route
app.get("/NighborElectricity", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Retrieve Electricity data for average calculation
    const electricityData = await Electricity.findOne({ user: userId });
    if (!electricityData || !electricityData.prevMonthElectricityActual) {
      console.error("No electricity data found for user");
      return res.status(404).send("No electricity data found");
    }

    const sum = electricityData.prevMonthElectricityActual.reduce(
      (acc, monthData) => {
        return acc + (monthData.billPrice || 0);
      },
      0
    );

    const count = electricityData.prevMonthElectricityActual.length;
    const electricityAvg = count > 0 ? sum / count : 0;

    // Retrieve or create NighborElectricity data
    let nighborElectricityData = await NighborElectricity.findOne({
      user: userId,
    });
    if (!nighborElectricityData) {
      // Create new document if not exists
      nighborElectricityData = new NighborElectricity({ user: userId });
    }

    // Update the userAvgElectricity field
    nighborElectricityData.userAvgElectricity = electricityAvg;
    await nighborElectricityData.save();

    // Send data to the EJS template
    res.render("nighborElectricity.ejs", {
      dataJson: JSON.stringify(nighborElectricityData),
      // Average electricity consumption
      isLoggedIn: req.session.isAuthenticated || false,
    });

    console.log("Retrieved data from the database:", nighborElectricityData);
  } catch (error) {
    console.error("Error fetching data from the database:", error);
    res.status(500).send("Internal Server Error");
  }
});

//Register
app.post("/register", async (req, res) => {
  const firstName = req.body["Fname"];
  const midName = req.body["Mname"];
  const lastName = req.body["Lname"];
  const ID = req.body["Id"];
  const PhoneNumber = req.body["Pnumber"];
  const email = req.body["Email"];
  const passOne = req.body["Password"];
  const passTwo = req.body["Password2"];
  const DateOfBirth = req.body["DOB"];
  const gender = req.body["Gender"];
  const income = req.body["Income"];
  const occupation = req.body["Occupation"];
  const ownership = req.body["OwnerShip"];
  const education = req.body["Education"];
  const residence = req.body["Residence"];
  const nOccupants = req.body["NOccupants"];
  const Typeresidence = req.body["Residence"];
  const Hsize = req.body["HouseSize"];
  const Nrooms = req.body["NBedrooms"];
  const Nbath = req.body["NBathrooms"];
  const cooling = req.body["NCooling"];
  const yearbuilt = req.body["YearBuilt"];

  try {
    const existingUser = await User.findOne({ userEmail: email });
    if (existingUser) {
      res.send("Email Found");
    } else if (passOne !== passTwo) {
      const errorMessage = "Passwords do not match. Please try again.";
      res.send(errorMessage);
    } else {
      const newUser = new User({
        Email: email,
        Password: passOne,
        Fname: firstName,
        Mname: midName,
        Lname: lastName,
        Id: ID,
        Pnumber: PhoneNumber,
        DOB: DateOfBirth,
        Gender: gender,
        Income: income,
        Occupation: occupation,
        OwnerShip: ownership,
        Education: education,
        Residence: residence,
        NOccupants: nOccupants,
        Residence: Typeresidence,
        HouseSize: Hsize,
        NBedrooms: Nrooms,
        NBathrooms: Nbath,
        NCooling: cooling,
        YearBuilt: yearbuilt,
      });
      console.log("User registered sccesfully");
      await newUser.save();
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred.");
  }
});
//
//login

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ Email: email });

    if (!user) {
      req.flash("error", "Email not found.");
      return res.redirect("/login");
    } else if (user.Password === password) {
      req.session.username = user.Fname + " " + user.Lname;
      req.session.name = user;
      req.session.user = user;
      req.session.isLoggedIn = true;

      const lastLoginDate = user.lastLogin;
      const currentMonth = new Date().getMonth() + 1;

      const existingData = await NighborElectricity.findOne({ user: user._id });
      if (
        !existingData &&
        (!lastLoginDate || lastLoginDate.getMonth() + 1 !== currentMonth)
      ) {
        const houseSize = user.HouseSize;
        const numResidents = user.NOccupants;
        const numRooms = user.NBedrooms;
        const numBathrooms = user.NBathrooms;

        const pythonProcess = spawn("python3", [
          "./main.py",
          houseSize.toString(),
          numResidents.toString(),
          numRooms.toString(),
          numBathrooms.toString(),
          currentMonth.toString(),
        ]);

        pythonProcess.stdout.on("data", async (data) => {
          try {
            const results = JSON.parse(data.toString());
            
            // Process and save the results to MongoDB
            const neighborElectricityData = new NighborElectricity({
              user: user._id,
              nighborElectricityFamily:
                results.average_electricity_similar_houses_in_residents,
              nighborElectricitySize:
                results.average_electricity_similar_houses_size,
              nighborElectricityBathroom:
                results.average_electricity_similar_houses_bathroom,
              nighborElectricityTotalAVG: results.total_average_electricity,
            });
            await neighborElectricityData.save();

            const neighborWaterData = new NighborWater({
              user: user._id,
              nighborWaterFamily:
                results.average_water_similar_houses_in_residents,
              nighborWaterSize: results.average_water_similar_houses_size,
              nighborWaterBathroom:
                results.average_water_similar_houses_bathroom,
              nighborWaterTotalAVG: results.total_average_water,
            });
            await neighborWaterData.save();

            // Update the lastLogin field in the user document
            user.lastLogin = new Date();
            await user.save();

            console.log(
              "Model process is completed successfully and the data is saved in database."
            );
          } catch (error) {
            console.error("Error processing Python script output:", error);
          }
        });

        pythonProcess.stderr.on("data", (data) => {
          console.error(`stderr: ${data}`);
        });
      } else {
        console.log(
          "Existing data found or user already logged in this month."
        );
      }

      return res.redirect("/menu");
    } else {
      req.flash("error", "Incorrect password.");
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("An error occurred.");
  }
});

//scrape Electricity
app.post("/run-elec-script", (req, res) => {
  process.env.USER_ID = req.session.user._id;

  const elecPythonProcess = spawn("python3", ["./pure.py"]);

  elecPythonProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  elecPythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  elecPythonProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    res.redirect("/Electricity");
  });
});
//scrape Electricity
//scrape Electricity

app.post("/api/uploadElecData", async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const ElecData = req.body;
    const userId = ElecData[0].userId;

    // Delete existing electricity data for the user
    await Electricity.deleteMany({ user: userId });

    // Assuming ElecData is an array of objects matching the prevElecDetailsSchema
    // You should add validation for ElecData here
    const thisMonth = ElecData[currentMonth];
    const secondMonth = ElecData[currentMonth + 1];
    const thirdMonth = ElecData[currentMonth + 2];
    const fourthMonth = ElecData[currentMonth + 3];
    const fifthMonth = ElecData[currentMonth + 4];
    const expectedNow = ElecData[currentMonth + 12];
    const expectedPrev = ElecData[currentMonth + 11];

    // Create a new instance of Electricity and associate it with the user
    const newElecData = new Electricity({
      currentMonthElectricityExpected: expectedNow.billPrice,
      currentMonthElectricityActual: thisMonth.billPrice,
      prevMonthElectricityExpected: expectedPrev.billPrice,
      prevMonthElectricityActual: ElecData,
      upcomingMonthElectricityExpected_1: secondMonth.billPrice,
      upcomingMonthElectricityExpected_2: thirdMonth.billPrice,
      upcomingMonthElectricityExpected_3: fourthMonth.billPrice,
      upcomingMonthElectricityExpected_4: fifthMonth.billPrice,
      user: userId, // Associate the electricity data with the user
    });

    await newElecData.save();
    console.log("Electricity Data Saved");
    res.redirect("/Electricity");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//
//////////////////////////////////////////////////////////////////////////////////////////////////
//scrapewater
app.post("/run-water-script", (req, res) => {
  process.env.USER_ID = req.session.user._id;

  const waterPythonProcess = spawn("python3", ["./water.py"]);

  waterPythonProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  waterPythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  waterPythonProcess.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    res.redirect("/Water");
  });
});

//WebScarping
//scrapewater

app.post("/api/uploadWaterData", async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const waterData = req.body;
    const userId = waterData[0].userId;

    // Delete existing water data for the user
    await Water.deleteMany({ user: userId });

    // Assuming waterData is an array of objects matching the prevWaterDetailsSchema
    // You should add validation for waterData here
    const thisMonth = waterData[currentMonth];
    const secondMonth = waterData[currentMonth + 1];
    const thirdMonth = waterData[currentMonth + 2];
    const fourthMonth = waterData[currentMonth + 3];
    const fifthMonth = waterData[currentMonth + 4];
    const expectedNow = waterData[currentMonth + 12];
    const expectedPrev = waterData[currentMonth + 11];

    // Create a new instance of Water and associate it with the user
    const newWaterData = new Water({
      currentMonthWaterExpected: expectedNow.billPrice,
      currentMonthWaterActual: thisMonth.billPrice,
      prevMonthWaterExpected: expectedPrev.billPrice,
      prevMonthWaterActual: waterData,
      upcomingMonthWaterExpected_1: secondMonth.billPrice,
      upcomingMonthWaterExpected_2: thirdMonth.billPrice,
      upcomingMonthWaterExpected_3: fourthMonth.billPrice,
      upcomingMonthWaterExpected_4: fifthMonth.billPrice,
      user: userId, // Associate the water data with the user
    });

    await newWaterData.save();
    console.log("Water Data Saved");
    res.redirect("/Water");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//update
app.post("/update", (req, res) => {
  const userId = req.session.user;

  const updatedInfo = {
    Fname: req.body["Fname"],
    Mname: req.body["Mname"],
    Lname: req.body["Lname"],
    Id: req.body["Id"],
    Email: req.body["Email"],
    NOccupants: req.body["NOccupants"],
    HouseSize: req.body["HouseSize"],
    NBedrooms: req.body["NBedrooms"],
    NBathrooms: req.body["NBathrooms"],
    NCooling: req.body["NCooling"],
  };

  User.findByIdAndUpdate(userId, updatedInfo, { new: true })
    .then((updatedUser) => {
      console.log(updatedUser);
      res.redirect("/logout");
    })
    .catch((err) => {
      console.log(err);
      // Handle the error appropriately
      res.status(500).send("Error updating user information");
    });
});

//logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("An error occurred.");
    }
    res.redirect("/");
  });
});
//

// Disable caching for responses
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Start the server
app.listen(port, () => {
  console.log("Server On");
});
