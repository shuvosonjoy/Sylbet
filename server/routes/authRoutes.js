const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/admin/verify', protect, admin, (req, res) => {
  res.json({ isAdmin: true, user: { _id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Sylbets Store" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Sylbets - Password Reset Request',
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #043927; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-family: 'Outfit', sans-serif; letter-spacing: -0.02em;">Sylbets</h1>
          </div>
          <div style="padding: 32px; background-color: #faf9f6; color: #1a1a2e;">
            <h2 style="margin-top: 0; color: #043927; font-size: 20px; font-family: 'Outfit', sans-serif;">Password Reset Request</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Hello ${user.name},</p>
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">You are receiving this email because you (or someone else) requested a password reset for your Sylbets account.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Please click the button below to reset your password. This link is valid for 1 hour.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background-color: #043927; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">Reset Password</a>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #6b7280; word-break: break-all;">If you cannot click the button above, copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color: #065f46;">${resetUrl}</a></p>
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-top: 32px;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="background-color: #efeee8; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            &copy; ${new Date().getFullYear()} Sylbets Store. All rights reserved.
          </div>
        </div>
      `
    };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
      }
    } catch (dbErr) {
      // Ignored
    }
    res.status(500).json({ message: error.message || 'Error sending password reset email' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

module.exports = router;
