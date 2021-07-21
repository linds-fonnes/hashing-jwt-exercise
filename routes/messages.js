const express = require("express");
const router = express.Router();
const ExpressError = require("../expressError");
const { ensureCorrectUser, ensureLoggedIn } = require("../middleware/auth");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try{
        const {username} = req.user;
        const {id} = req.params;
        const message = await Message.get(id);
        if(message.to_user.username !== username && message.from_user.username !== username){
            throw new ExpressError("Unauthorized access to this message", 401);
        }
        return res.json({message})
    } catch (e) {
        return next(e);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async (req, res, next) => {
    try{
        const from_username = req.user.username;
        const {to_username, body} = req.body;
        const new_message = await Message.create({from_username, to_username, body});
        return res.json({new_message})
    } catch(e){
        return next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try{
        const {id} = req.params;
        const {username} = req.user;
        const message = await Message.get(id)
        

        if(message.to_user.username !== username){
            throw new ExpressError("Unauthorized access to this message", 401);
        }
        const read_msg = await Message.markRead(id)
        return res.json({read_msg})
    } catch (e) {
        return next(e)
    }
})

module.exports = router;