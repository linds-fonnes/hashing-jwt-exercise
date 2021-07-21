const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");


const User = require("../models/user");
const {SECRET_KEY} = require("../config");
const ExpressError = require("../expressError");

/** POST /login - login: {username, password} => {token}
 **/

router.post("/login", async (req, res, next) => {
    try {
        const {username, password} = req.body;
        if (await User.authenticate(username, password)){
            const _token = jwt.sign({username}, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({_token})
        } else {
            throw new ExpressError("Invalid username/password", 400)
        }
    }catch(e){
        return next(e)
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async(req,res,next) => {
    try{
        let {username} = await User.register(req.body);
        let _token = jwt.sign({username}, SECRET_KEY);
        User.updateLoginTimestamp(username);
        return res.json({_token})
        
    } catch(e){
        return next(e)
    }
})

module.exports = router