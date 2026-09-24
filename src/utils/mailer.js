import nodemailer from "nodemailer";
import { getEMAIL, getPASS } from "./getKey.js";

let transporter = null;

export const sendMail = ({ to, subject, text }) => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: getEMAIL(), pass: getPASS() }, // Gmail app password
    });
  }
  return transporter.sendMail({ from: `Recepta <${getEMAIL()}>`, to, subject, text });
};
