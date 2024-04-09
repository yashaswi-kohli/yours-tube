import Multer from "multer";

const storage = Multer.diskStorage({
    //* the request, the file we have got, and callback func, which says to run cb after running some opn

    destination: function(req, file, cb) {
        //* first error, second destination where we want to store
        return cb(null, './public/temp');
    },
    filename: function(req, file, cb) {
        //* first error, second file name
        return cb(null, file.originalname)
    }
});

export const upload = Multer({
    storage,
});