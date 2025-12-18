
// app.post(
//   "/orders",
//   transformOrder,       // normalize input
//   validateOrderInput,   // express-validator
//   inspect,              // logs request
//   gatekeeper,           // authenticate JWT
//   roleBouncer("user"),  // authorize role
//   zipper,               // attach extra context
//   createOrderController // <-- controller
// );

import sanitize from 'mongo-sanitize';


export const transformLogin = (req, res, next) => {

    try {
        if (req.body.email) {
            req.body.email = req.body.email.toLowerCase().trim();
        }
        if (req.body.password) {
            req.body.password = req.body.password.trim();
        }
        req.body = sanitize(req.body);

        next();
    } catch (err) {
        res.status(500).send('lol');
    }

}

