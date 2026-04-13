const express = require("express");
const nodemailer = require("nodemailer");
const { checkSchema, validationResult } = require("express-validator");
const cors = require("cors");
require("dotenv").config();

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const receiver = process.env.RECEIVER;
console.log({ receiver })
const app = express();
const port = process.env.PORT || 3000; // You can change this port number if needed
// Enable CORS for all routes with specific configuration
app.use(cors({
  origin: ['https://logopaedie-roseneck.de', 'https://www.logopaedie-roseneck.de', 'https://cms.logopaedie-roseneck.de'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

// Middleware to parse JSON bodies
app.use(express.json());

// POST route handler
app.post(
  "/mail",
  // express-validator schema for form data
  checkSchema(
    {
      senderAddress: {
        trim: true,
        isEmail: true,
        normalizeEmail: true,
        optional: { nullable: true, checkFalsy: true },
      },
      fon: {
        trim: true,
        escape: true,
        isLength: { options: { max: 20 } },
        optional: { nullable: true, checkFalsy: true },
      },
      contactMessage: {
        isString: true,
        trim: true,
        notEmpty: true,
        escape: true,
        isLength: { options: { max: 400 } },
      },
      name: {
        isString: true,
        trim: true,
        notEmpty: true,
        escape: true,
        isLength: { options: { max: 100 } },
      },
      dataProtection: { isBoolean: true },
    },
    ["body"]
  ),
  (req, res) => {
    //Handle validation errors
    console.log("We recieved a request!");
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      console.log("We have a validation error! \n", validationErrors.array());
      return res.status(400).json({
        errors: validationErrors.array(),
        message: "There was a validation error",
      });
    }
    console.log("No validation errors, lets continue");
    // Destructure body and check for data protection consent
    const { name, fon, senderAddress, contactMessage, dataProtection } =
      req.body;
    if (!dataProtection) {
      console.log("Uhhh data protection was not accepted, cannot send message");
      return res
        .status(403)
        .json({ error: "Data Protection must be accepted" });
    }

    // Create the transporter with your SMTP settings

    console.log("Creating email transporter with host:", host, "email:", email);

    const transporter = nodemailer.createTransport({
      host: host,
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: password,
      },
      // Configure your email provider settings here
      // Example: service: 'Gmail', auth: { user: 'YOUR_EMAIL', pass: 'YOUR_PASSWORD' }
      // Refer to Nodemailer documentation for more options: https://nodemailer.com/
    });



    const message = `Neue Nachricht ${name ? "von " + name : ", die ohne Namen eingereicht wurde."
      } 
    
    Kontaktdaten:  
    ${fon ? "Telefon: " + fon + "\n" : ""} 
    ${senderAddress ? "Email: " + senderAddress + "\n" : ""}  
    
    Nachricht:
    
    ${contactMessage} `;

    const mailOptions = {
      from: email,
      to: receiver,
      subject: name
        ? "New Contact Request from " + name
        : "New Contactrequest from Unknown",
      text: message,
    };

    // Send the email with timeout
    const emailTimeout = setTimeout(() => {
      console.error("Email sending timed out");
      res.status(500).json({ error: "Email sending timed out." });
    }, 30000); // 30 second timeout

    transporter.sendMail(mailOptions, (error, info) => {
      clearTimeout(emailTimeout);
      if (error) {
        console.error("Email sending error:", error);
        res
          .status(500)
          .json({ error: "An error occurred while sending the email." });
      } else {
        console.log("Email sent: " + info.response);
        res.json({ message: "Email sent successfully." });
      }
    });
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
