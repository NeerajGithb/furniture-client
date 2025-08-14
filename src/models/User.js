import mongoose from "mongoose";
import bcrypt from "bcrypt";
import slugify from "slugify";

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Invalid email address"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, "Invalid phone number"],
      unique: true,
      sparse: true,
    },
    address: addressSchema,
    photoURL: {
      type: String,
      default: "",
    },
    hasOAuth: {
      type: Boolean,
      default: false,
    },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  try {
    const user = this;

    // Hash only if modified and present
    if (user.isModified("password") && user.password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    }

    // Slugify name if new or changed
    if (!user.slug || user.isModified("name")) {
      user.slug = slugify(user.name, { lower: true, strict: true });
    }

    next();
  } catch (err) {
    next(err);
  }
});

// Password check method
userSchema.methods.comparePassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

export default mongoose.models.User || mongoose.model("User", userSchema);
