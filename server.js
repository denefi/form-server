const express = require("express");
const nodemailer = require("nodemailer");
const { checkSchema, validationResult } = require("express-validator");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000; // You can change this port number if needed
// Enable CORS for all routes
app.use(cors());

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
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }
    // Destructure body and check for data protection consent
    const { name, fon, senderAddress, contactMessage, dataProtection } =
      req.body;
    if (!dataProtection) {
      return res
        .status(403)
        .json({ error: "Data Protection must be accepted" });
    }

    // Create the transporter with your SMTP settings
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
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
    // Compose the email

    const message = `Neue Nachricht ${
      name ? "von " + name : ", die ohne Namen eingereicht wurde."
    } 
    
    Kontaktdaten:  
    ${fon ? "Telefon: " + fon + "\n" : ""} 
    ${senderAddress ? "Email: " + senderAddress + "\n" : ""}  
    
    Nachricht:
    
    ${contactMessage} `;

    const mailOptions = {
      from: email,
      to: process.env.RECEIVER,
      subject: name
        ? "New Contact Request from " + name
        : "New Contactrequest from Unknown",
      text: message,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
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
