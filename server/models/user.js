import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {type:String, required: true, trim: true},
        email: {type:String, required: true, unique: true, lowercase: true},
        password: {type:String, required: true, minlength: 6},
    },
    {timestamps: true}
);

//hash password before saving-- middleware hook in mongoose :“Before any user document is saved to the database, run this function.”
// when does it run? whenever you do :await user.save();
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next(); // if password hasn't changes,skip hashing
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);