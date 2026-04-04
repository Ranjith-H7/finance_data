import mongoose,{Schema,Document} from 'mongoose';

export interface IUser extends Document{
    name:string;
    email:string;
    password:string;
    role:'viewer'|'analyst'|'admin';
    status:'active'|'inactive';
}

const userSchema:Schema =new Schema(

    {
        name:{type:String,required:true},
        email:{type:String,required:true,unique:true},
        password:{type:String,required:true},

        role:{
            type:String,
            enum:['viewer','analyst','admin'],
            default:'viewer',
        },
        status:{
            type:String,
            enum:['active','inactive'],
            default:'active',
        },
    },
     {timestamps:true}
);

export default mongoose.model<IUser>('User',userSchema);