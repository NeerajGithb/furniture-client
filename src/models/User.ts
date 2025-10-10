import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import slugify from 'slugify';

export interface IUser extends Document {
  name: string;
  slug: string;
  email: string;
  password?: string;
  phone?: string;
  photoURL?: string;
  hasOAuth: boolean;
  resetCode?: string;
  resetCodeExpires?: Date;
  comparePassword(inputPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, lowercase: true, unique: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email address'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
      unique: true,
      sparse: true,
    },
    photoURL: { type: String, default: '' },
    hasOAuth: { type: Boolean, default: false },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  const user = this as IUser;

  if (user.isModified('password') && user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }

  if (!user.slug || user.isModified('name')) {
    let baseSlug = slugify(user.name, { lower: true, strict: true });
    let slug = baseSlug;
    let i = 1;

    while (await mongoose.models.User.findOne({ slug })) {
      slug = `${baseSlug}-${i++}`;
    }
    user.slug = slug;
  }

  next();
});

userSchema.methods.comparePassword = function (inputPassword: string) {
  return bcrypt.compare(inputPassword, this.password || '');
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
