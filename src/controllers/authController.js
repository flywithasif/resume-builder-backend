import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

export async function register(req, res) {
  const { name, email, password } = req.body;

  /*
  |--------------------------------------------------------------------------
  | Basic Validation
  |--------------------------------------------------------------------------
  */

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required.",
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Name must contain at least 2 characters.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize Email
  |--------------------------------------------------------------------------
  */

  const normalizedEmail = email.trim().toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Existing User
  |--------------------------------------------------------------------------
  */

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Create User
  |--------------------------------------------------------------------------
  */

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  /*
  |--------------------------------------------------------------------------
  | JWT
  |--------------------------------------------------------------------------
  */

  const token = signToken(user._id.toString());

  /*
  |--------------------------------------------------------------------------
  | Response
  |--------------------------------------------------------------------------
  */

  return res.status(201).json({
    success: true,
    message: "Account created successfully.",
    token,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Find User
  |--------------------------------------------------------------------------
  */

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  /*
  |--------------------------------------------------------------------------
  | Check Credentials
  |--------------------------------------------------------------------------
  */

  if (
    !user ||
    !(await user.comparePassword(password))
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | JWT
  |--------------------------------------------------------------------------
  */

  const token = signToken(user._id.toString());

  /*
  |--------------------------------------------------------------------------
  | Response
  |--------------------------------------------------------------------------
  */

  return res.json({
    success: true,
    message: "Login successful.",
    token,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
}

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

export async function me(req, res) {
  return res.json({
    success: true,

    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
}