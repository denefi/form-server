const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { checkSchema, validationResult } = require("express-validator");

const app = express();
const port = process.env.PORT || 3000; // You can change this port number if needed

// Middleware to parse JSON bodies
app.use(express.json());

// POST route handler
app.post(
  "/mail",
  checkSchema(
    {
      senderAddress: {
        trim: true,
        optional: { nullable: true, checkFalsy: true },
        isEmail: true,
        normalizeEmail: true,
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Handle validation errors
      return res.status(400).json({ errors: errors.array() });
    }
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const { name, fon, senderAddress, contactMessage, dataProtection } =
      req.body;
    if (!dataProtection) {
      return res
        .status(403)
        .json({ error: "Data Protection must be accepted" });
    }
    if (!email) {
      return res.status(500).json({ error: "Email address not specified." });
    }

    // Create the transporter with your SMTP settings
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
