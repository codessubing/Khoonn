import express from "express";
const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // TODO: Integrate Email Service (e.g., Nodemailer, SendGrid, Resend)
  // For now, we'll just log it to console to prove it works
  console.log("📩 New Contact Message:", { name, email, phone, message });

  res.status(200).json({ message: "Message sent successfully!" });
});

export default router;