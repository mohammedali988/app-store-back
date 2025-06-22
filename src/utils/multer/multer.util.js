import multer from "multer";
import { v4 as uuidv4 } from 'uuid';

const storge = multer.diskStorage({
    
    
    destination:(req,file,cb)=>{
        cb(null,"public")
    },
    filename:(req,file,cb)=>{
        if (file) {
            const uniqueName = `${uuidv4()}-${file.originalname}`;
            cb(null, uniqueName);
        }
    }
})

export const upload = multer({ storage: storge })