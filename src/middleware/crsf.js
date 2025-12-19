


const generateCrsf = (req, res, next) => {
    const crsfToken = crypto.randomBytes(32).toString('hex');

    res.cookie('XSRF-TOKEN', crsfToken);
    next();
}

const validateCrsf = (req, res, next) => {
    const tokenFromHeader = req.header['x-xsrf-token'];
    const tokenFromCookie = req.cookies['XSRF-TOKEN'];

    if(tokenFromHeader && tokenFromHeader === tokenFromCookie){
        next();
    } else {
        res.status(403).json({
            message : "CSRF attacked detected"
        })
    }
}
