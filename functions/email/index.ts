import { supportEmail, adminEmail } from "../../constants";
import { verifyEmail } from "../auth";
const { Sender } = require("node-mailjet");
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const EMAIL_SECRET_KEY = process.env.EMAIL_SECRET_KEY;

const mailjet = require("node-mailjet").apiConnect(
  EMAIL_API_KEY,
  EMAIL_SECRET_KEY
);

export const sendEmail = async (
  email: string,
  subject: string,
  content: string
) => {
  try {
    const request = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: supportEmail,
            Name: "Fortune Support",
          },
          To: [
            {
              Email: email,
            },
          ],
          Subject: subject,
          HTMLPart: content,
        },
      ],
    });

    return request.response.status;
  } catch (error) {
    return 500;
  }
};

export const contactEmail = async (
  email: string,
  subject: string,
  content: string
) => {
  try {
    const request = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: supportEmail,
            Name: "Fortune Support"
          },
          To: [
            {
              Email: adminEmail
            },
          ],
          Subject: subject,
          HTMLPart: content,
        },
      ],
    });

    return request.response.status;
  } catch (error) {
    return 500;
  }
};

export const createRegisterEmailCotent = async (
  verifyLink: string,
  name: string
) => {
  const content: string = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 10px;
                background-color: #f9f9f9;
              }
              .header, .footer {
                background-color: #e4111f;
                color: white;
                padding: 10px 20px;
                border-radius: 10px 10px 0 0;
              }
              .footer {
                border-radius: 0 0 10px 10px;
                text-align: center;
              }
              .content {
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                padding: 10px 20px;
                margin: 20px 0;
                color: white !important;
                background-color: #e21010;
                text-decoration: none;
                border-radius: 5px;
              }
              .highlight {
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>How Lucky 2025 - Verify Your Email</h2>
              </div>
              <div class="content">
                <p>Hello ${name},</p>
                <p>Thank you for register in our platform - HowLucky2025</p>
                <p>To use our service, you should verify your email.</p>
                <p>Please use link below or click Verify button.</p>
                <p>${verifyLink}</p>
                <a href="${verifyLink}" target="_blank" class="button">Verify</a>
                <p>If you have any questions or need assistance, please contact our support team.</p>
                <p>Thank you,</p>
                <p>The HowLucky2025 Team</p>
              </div>
              <div class="footer">
                <p>&copy; 2024 - 2025 HowLucky2025 Team</p>
              </div>
            </div>
          </body>
        </html>
        `;

  return content;
};

