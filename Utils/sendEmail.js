import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

export const sendEmail = async (
  subject,
  send_to,
  sent_from,
  reply_to,
  name,
  link,
  p1,
  p2,
  btn_text
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Options for sending email
  const options = {
    to: send_to,
    from: sent_from,
    replyTo: reply_to,
    subject: subject,
    html: `
    <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="background-color: #f0f0f0; padding: 24px; font-family: Arial, sans-serif; margin: 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px;">
            <tr>
              <td style="background-color: #1e1eff; color: #ffffff; padding: 12px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">EazyBlog: <span style="font-size: 22px;">Get Latest News</span></h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px;">
                <p style="font-size: 24px; color: #333;">Hello <span style="color: #fe3838;">${name}</span>,</p>
                <p style="font-size: 16px; color: #555;">We're excited to bring you the latest updates. Stay tuned for more!</p>
                <p style="font-size: 16px; color: #555;">Check out our latest posts and news on our blog.</p>
                <p style="font-size: 16px; color: #555;">${p1}</p>
                <p style="font-size: 16px; color: #555;">${p2}</p>
                <a href=${link} target="_blank" style="text-decoration: none;">
                  <button
                    style="
                      background-color: #fe3838;
                      color: white;
                      padding: 12px 24px;
                      border-radius: 4px;
                      border: none;
                      cursor: pointer;
                      font-size: 16px;
                      display: inline-block;
                    "
                  >
                    ${btn_text}
                  </button>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px;">
                <p style="font-size: 16px; color: #555;">Regards,</p>
                <p style="font-size: 16px; font-weight: bold; color: #555;">Team EazyBlog</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
  };
  // Send email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log("Error occurred while sending email:", err);
    } else {
      console.log("Email sent successfully:", info);
    }
  });
};
